#!/usr/bin/env python3
"""Local web editor for the HappyDays article library.

Run:
    python server.py

Then open:
    http://127.0.0.1:8000/wiki/editor.html

The server binds to localhost only. It exposes a small JSON API for editing
Markdown articles, creating topics, and previewing Markdown. Every successful
write updates article/article.json, then runs build.py to regenerate
assets/data.js.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import threading
import uuid
from datetime import date, datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import build


ROOT = Path(__file__).resolve().parent
ARTICLE_DIR = ROOT / "article"
MANIFEST_PATH = ARTICLE_DIR / "article.json"
EDITS_PATH = ARTICLE_DIR / "edits.json"
HISTORY_PATH = ARTICLE_DIR / "history.json"
COMMENT_DIR = ROOT / "comment"
COMMENT_PATH = COMMENT_DIR / "comment.json"
BGM_DIR = ROOT / "BGM"
BGM_PATH = BGM_DIR / "BGM.json"
HOME_DIR = ROOT / "home"
HOME_PATH = HOME_DIR / "home.json"
PHOTOS_DIR = ROOT / "photos"
PHOTOS_PATH = PHOTOS_DIR / "photos.json"
ARTICLE_ICON_DIR = ARTICLE_DIR / "icon"
TITLE_PATH = ROOT / "title.json"
IMAGE_DIR = ROOT / "assets" / "image"
DATA_PATH = ROOT / "assets" / "data.js"
BUILD_SCRIPT = ROOT / "build.py"
BASE_PATH = "/wiki"
MAX_REQUEST_BYTES = 2 * 1024 * 1024
MAX_BGM_BYTES = 50 * 1024 * 1024
MAX_HOME_IMAGE_BYTES = 20 * 1024 * 1024
MAX_PHOTO_BYTES = 25 * 1024 * 1024
MAX_ICON_BYTES = 10 * 1024 * 1024
MAX_BODY_CHARS = 800_000
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
TITLE_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
HISTORY_HASH_RE = re.compile(r"^[0-9a-fA-F]{7,40}$")
LOCK = threading.Lock()


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def read_manifest() -> dict:
    if not MANIFEST_PATH.is_file():
        raise ApiError(500, "找不到 article/article.json")
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 article/article.json: {exc}")
    if not isinstance(manifest, dict):
        raise ApiError(500, "article/article.json 格式无效")
    if not isinstance(manifest.get("topics"), list) or not isinstance(manifest.get("articles"), list):
        raise ApiError(500, "article/article.json 缺少 topics 或 articles")
    return manifest


def atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp-{os.getpid()}-{threading.get_ident()}")
    try:
        with temporary.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            try:
                temporary.unlink()
            except OSError:
                pass


def atomic_write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp-{os.getpid()}-{threading.get_ident()}")
    try:
        with temporary.open("wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            try:
                temporary.unlink()
            except OSError:
                pass


def write_manifest(manifest: dict) -> None:
    atomic_write(
        MANIFEST_PATH,
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    )


def topic_map(manifest: dict) -> dict[str, dict]:
    result = {}
    for topic in manifest["topics"]:
        if isinstance(topic, dict) and isinstance(topic.get("id"), str):
            result[topic["id"]] = topic
    return result


def article_map(manifest: dict) -> dict[str, dict]:
    result = {}
    for article in manifest["articles"]:
        if isinstance(article, dict) and isinstance(article.get("slug"), str):
            result[article["slug"]] = article
    return result


def read_edits() -> dict:
    if not EDITS_PATH.is_file():
        return {"version": 1, "articles": {}}
    try:
        data = json.loads(EDITS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 article/edits.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("articles"), dict):
        raise ApiError(500, "article/edits.json 格式无效")
    return data


def read_title_config() -> dict:
    if not TITLE_PATH.is_file():
        return {"titles": []}
    try:
        data = json.loads(TITLE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 title.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("titles"), list):
        raise ApiError(500, "title.json 格式无效")
    return data


def write_edits(edits: dict) -> None:
    atomic_write(
        EDITS_PATH,
        json.dumps(edits, ensure_ascii=False, indent=2) + "\n",
    )


def read_comments() -> dict:
    if not COMMENT_PATH.is_file():
        return {"version": 2, "articles": {}}
    try:
        data = json.loads(COMMENT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 comment/comment.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("articles"), dict):
        raise ApiError(500, "comment/comment.json 格式无效")
    return data


def write_comments(data: dict) -> None:
    atomic_write(
        COMMENT_PATH,
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def article_comments(slug: str) -> list[dict]:
    comments = read_comments()["articles"].get(slug, [])
    if not isinstance(comments, list):
        return []
    return [item for item in comments if isinstance(item, dict)]


def add_article_comment(slug: str, payload: dict) -> dict:
    record = article_map(read_manifest()).get(slug)
    if record is None:
        raise ApiError(404, "文章不存在")
    author = require_text(payload.get("author"), "署名", 80)
    body = require_text(payload.get("body"), "评论", 2000, multiline=True)
    comment_id = str(uuid.uuid4())
    relative_file = f"{slug}/{comment_id}.md"
    markdown_path = COMMENT_DIR / relative_file
    comment = {
        "id": comment_id,
        "author": author,
        "at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "file": relative_file,
        "body": body,
    }
    with LOCK:
        atomic_write(markdown_path, body + "\n")
        data = read_comments()
        comments = data["articles"].setdefault(slug, [])
        if not isinstance(comments, list):
            raise ApiError(500, "comment/comment.json 中该文章的评论格式无效")
        comments.append(comment)
        write_comments(data)
        commit = auto_commit(
            [COMMENT_PATH, markdown_path],
            f"docs: 添加评论「{record.get('title', slug)}」（{author}）",
            author,
        )
    return {
        "ok": True,
        "comment": comment,
        "comments": article_comments(slug),
        "commit": commit,
    }


def read_bgm_config() -> dict:
    if not BGM_PATH.is_file():
        return {"version": 1, "tracks": []}
    try:
        data = json.loads(BGM_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 BGM.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("tracks"), list):
        raise ApiError(500, "BGM.json 格式无效")
    return data


def write_bgm_config(data: dict) -> None:
    atomic_write(
        BGM_PATH,
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def add_bgm_track(payload: dict, audio: bytes) -> dict:
    title = require_text(payload.get("title"), "歌名", 120)
    raw_weight = payload.get("weight", 1)
    if isinstance(raw_weight, bool) or not isinstance(raw_weight, (int, float)):
        raise ApiError(400, "权重必须是数字")
    weight = float(raw_weight)
    if not math.isfinite(weight) or weight <= 0 or weight > 1_000_000:
        raise ApiError(400, "权重必须大于 0 且不超过 1000000")
    if weight.is_integer():
        weight = int(weight)

    filename = str(payload.get("filename") or "").strip()
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ApiError(400, "文件名无效")
    if len(filename) > 160:
        raise ApiError(400, "文件名不能超过 160 个字符")
    if any(ord(character) < 32 for character in filename):
        raise ApiError(400, "文件名包含非法字符")
    suffix = Path(filename).suffix.lower()
    if suffix not in (".mp3", ".wav"):
        raise ApiError(400, "只支持 .mp3 和 .wav 文件")
    if not audio:
        raise ApiError(400, "音频文件不能为空")

    BGM_DIR.mkdir(parents=True, exist_ok=True)
    target = BGM_DIR / filename
    if target.exists():
        raise ApiError(409, "BGM 目录中已存在同名文件")
    track = {"file": filename, "title": title, "weight": weight}
    try:
        atomic_write_bytes(target, audio)
        data = read_bgm_config()
        data["tracks"].append(track)
        write_bgm_config(data)
    except Exception:
        if target.exists():
            target.unlink()
        raise
    commit = auto_commit(
        [target, BGM_PATH],
        f"docs: 添加 BGM「{title}」",
    )
    log_change(
        f"BGM 上传：{title}（文件={filename}，本地提交={'是' if commit.get('committed') else '否'}）"
    )
    return {"ok": True, "track": track, "tracks": data["tracks"], "commit": commit}


def delete_bgm_track(filename: str) -> dict:
    filename = str(filename or "").strip()
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ApiError(400, "文件名无效")
    if Path(filename).suffix.lower() not in (".mp3", ".wav"):
        raise ApiError(400, "只支持 .mp3 和 .wav")
    with LOCK:
        target = BGM_DIR / filename
        if not target.is_file():
            raise ApiError(404, "音乐不存在")
        data = read_bgm_config()
        remaining = [track for track in data["tracks"] if track.get("file") != filename]
        if len(remaining) == len(data["tracks"]):
            raise ApiError(404, "音乐不在 BGM.json 中")
        audio_snapshot = target.read_bytes()
        config_snapshot = BGM_PATH.read_bytes()
        try:
            data["tracks"] = remaining
            write_bgm_config(data)
            target.unlink()
        except Exception:
            atomic_write_bytes(target, audio_snapshot)
            atomic_write(BGM_PATH, config_snapshot.decode("utf-8"))
            raise
        log_change(f"BGM 删除完成：{filename}（Git 提交转到后台）")
        commit_in_background(
            [target, BGM_PATH],
            f"docs: 删除 BGM「{filename}」",
            f"BGM 删除：{filename}",
        )
        return {
            "ok": True,
            "deleted": filename,
            "tracks": data["tracks"],
            "commit": {"committed": False, "pending": True},
        }


def default_photos_config() -> dict:
    return {"version": 1, "galleries": [{"name": "默认图库", "albums": []}]}


def read_photos_config() -> dict:
    if not PHOTOS_PATH.is_file():
        return default_photos_config()
    try:
        data = json.loads(PHOTOS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 photos/photos.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("galleries"), list):
        raise ApiError(500, "photos/photos.json 格式无效")
    galleries = []
    for gallery in data["galleries"]:
        if not isinstance(gallery, dict) or not isinstance(gallery.get("name"), str):
            raise ApiError(500, "photos/photos.json 图库格式无效")
        albums = []
        for album in gallery.get("albums", []):
            if (
                not isinstance(album, dict)
                or not isinstance(album.get("name"), str)
                or not isinstance(album.get("folder"), str)
                or not isinstance(album.get("images", []), list)
            ):
                raise ApiError(500, "photos/photos.json 相册格式无效")
            images = []
            for image in album.get("images", []):
                if not isinstance(image, dict) or not isinstance(image.get("file"), str):
                    raise ApiError(500, "photos/photos.json 图片格式无效")
                images.append(
                    {
                        "file": image["file"],
                        "order": int(image.get("order", len(images) + 1)),
                    }
                )
            images.sort(key=lambda item: (item["order"], item["file"]))
            albums.append(
                {
                    "name": album["name"],
                    "folder": album["folder"],
                    "order": int(album.get("order", len(albums) + 1)),
                    "images": images,
                }
            )
        albums.sort(key=lambda item: (item["order"], item["folder"]))
        galleries.append({"name": gallery["name"], "albums": albums})
    if not galleries:
        galleries = [{"name": "默认图库", "albums": []}]
    return {"version": 1, "galleries": galleries}


def write_photos_config(data: dict) -> None:
    atomic_write(
        PHOTOS_PATH,
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def find_photo_album(data: dict, folder: str) -> tuple[dict | None, dict | None]:
    for gallery in data["galleries"]:
        for album in gallery["albums"]:
            if album.get("folder") == folder:
                return gallery, album
    return None, None


def add_photos_album(payload: dict) -> dict:
    name = require_text(payload.get("name"), "相册名称", 80)
    folder = str(payload.get("folder") or "").strip()
    if not folder or "/" in folder or "\\" in folder or folder in (".", ".."):
        raise ApiError(400, "相册文件夹名无效")
    if len(folder) > 120 or any(ord(character) < 32 for character in folder):
        raise ApiError(400, "相册文件夹名包含非法字符")
    gallery_name = str(payload.get("gallery") or "").strip() or "默认图库"
    if len(gallery_name) > 80 or any(ord(character) < 32 for character in gallery_name):
        raise ApiError(400, "图库名称无效")
    with LOCK:
        data = read_photos_config()
        _, existing = find_photo_album(data, folder)
        if existing is not None:
            raise ApiError(409, "相册文件夹名已存在")
        target = (PHOTOS_DIR / folder).resolve()
        try:
            target.relative_to(PHOTOS_DIR.resolve())
        except ValueError:
            raise ApiError(400, "相册文件夹路径无效")
        if target.exists() and any(target.iterdir()):
            raise ApiError(409, "photos 目录中已存在同名非空文件夹")
        target.mkdir(parents=True, exist_ok=True)
        gallery = next((item for item in data["galleries"] if item["name"] == gallery_name), None)
        if gallery is None:
            gallery = {"name": gallery_name, "albums": []}
            data["galleries"].append(gallery)
        order = max((album.get("order", 0) for album in gallery["albums"]), default=0) + 1
        album = {"name": name, "folder": folder, "order": order, "images": []}
        gallery["albums"].append(album)
        try:
            write_photos_config(data)
        except Exception:
            raise
        log_change(f"相册创建：{name}（文件夹={folder}，图库={gallery_name}）")
        commit_in_background(
            [PHOTOS_PATH],
            f"docs: 创建相册「{name}」",
            f"相册创建：{name}",
        )
        return {"ok": True, "album": album, "gallery": gallery_name}


def upload_photos_image(folder: str, filename: str, image: bytes) -> dict:
    folder = str(folder or "").strip()
    filename = str(filename or "").strip()
    if not folder or "/" in folder or "\\" in folder or folder in (".", ".."):
        raise ApiError(400, "相册文件夹名无效")
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ApiError(400, "图片文件名无效")
    if Path(filename).suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        raise ApiError(400, "只支持 .png、.jpg、.jpeg、.webp、.gif 图片")
    if not image:
        raise ApiError(400, "图片文件不能为空")
    with LOCK:
        data = read_photos_config()
        gallery, album = find_photo_album(data, folder)
        if album is None:
            raise ApiError(404, "相册不存在")
        album_dir = (PHOTOS_DIR / folder).resolve()
        try:
            album_dir.relative_to(PHOTOS_DIR.resolve())
        except ValueError:
            raise ApiError(400, "相册文件夹路径无效")
        album_dir.mkdir(parents=True, exist_ok=True)
        target = album_dir / filename
        if target.exists():
            raise ApiError(409, "相册中已存在同名图片")
        order = max((item.get("order", 0) for item in album["images"]), default=0) + 1
        image_item = {"file": filename, "order": order}
        try:
            atomic_write_bytes(target, image)
            album["images"].append(image_item)
            write_photos_config(data)
        except Exception:
            if target.exists():
                target.unlink()
            raise
        log_change(f"相册图片上传：{album['name']} / {filename}（本地提交转到后台）")
        commit_in_background(
            [target, PHOTOS_PATH],
            f"docs: 上传相册图片「{album['name']} / {filename}」",
            f"相册图片上传：{album['name']} / {filename}",
        )
        return {"ok": True, "album": album, "image": image_item}


def delete_photos_image(folder: str, filename: str) -> dict:
    folder = str(folder or "").strip()
    filename = str(filename or "").strip()
    if not folder or "/" in folder or "\\" in folder or folder in (".", ".."):
        raise ApiError(400, "相册文件夹名无效")
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ApiError(400, "图片文件名无效")
    with LOCK:
        data = read_photos_config()
        gallery, album = find_photo_album(data, folder)
        if album is None:
            raise ApiError(404, "相册不存在")
        target = (PHOTOS_DIR / folder / filename).resolve()
        try:
            target.relative_to(PHOTOS_DIR.resolve())
        except ValueError:
            raise ApiError(400, "图片路径无效")
        if not target.is_file():
            raise ApiError(404, "图片不存在")
        config_snapshot = PHOTOS_PATH.read_bytes()
        audio_snapshot = target.read_bytes()
        album["images"] = [item for item in album["images"] if item.get("file") != filename]
        try:
            write_photos_config(data)
            target.unlink()
        except Exception:
            atomic_write(PHOTOS_PATH, config_snapshot.decode("utf-8"))
            atomic_write_bytes(target, audio_snapshot)
            raise
        log_change(f"相册图片删除：{album['name']} / {filename}（本地提交转到后台）")
        commit_in_background(
            [target, PHOTOS_PATH],
            f"docs: 删除相册图片「{album['name']} / {filename}」",
            f"相册图片删除：{album['name']} / {filename}",
        )
        return {"ok": True, "album": album, "deleted": filename}


def read_home_config() -> dict:
    if not HOME_PATH.is_file():
        return {"version": 1, "intervalSeconds": 5, "images": []}
    try:
        data = json.loads(HOME_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 home.json: {exc}")
    return validate_home_config(data)


def validate_home_config(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ApiError(400, "home.json 必须是 JSON 对象")
    raw_interval = data.get("intervalSeconds", 5)
    if isinstance(raw_interval, bool) or not isinstance(raw_interval, (int, float)):
        raise ApiError(400, "轮换间隔必须是数字")
    interval = float(raw_interval)
    if not math.isfinite(interval) or interval < 3 or interval > 3600:
        raise ApiError(400, "轮换间隔必须在 3–3600 秒之间")
    if interval.is_integer():
        interval = int(interval)

    raw_images = data.get("images", [])
    if not isinstance(raw_images, list):
        raise ApiError(400, "images 必须是数组")
    images = []
    seen = set()
    for item in raw_images:
        if not isinstance(item, dict):
            raise ApiError(400, "图片配置必须是对象")
        filename = str(item.get("file") or "").strip()
        if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
            raise ApiError(400, "图片文件名无效")
        if Path(filename).suffix.lower() not in (".png", ".jpg", ".jpeg"):
            raise ApiError(400, "首页图片只支持 .png、.jpg、.jpeg")
        if filename in seen:
            raise ApiError(400, "首页图片文件名不能重复")
        seen.add(filename)
        target = HOME_DIR / filename
        if not target.is_file():
            raise ApiError(400, f"首页图片不存在: {filename}")
        raw_weight = item.get("weight")
        if isinstance(raw_weight, bool) or not isinstance(raw_weight, (int, float)):
            raise ApiError(400, "图片权重必须是数字")
        weight = float(raw_weight)
        if not math.isfinite(weight) or weight <= 0 or weight > 1_000_000:
            raise ApiError(400, "图片权重必须大于 0 且不超过 1000000")
        if weight.is_integer():
            weight = int(weight)
        images.append({"file": filename, "weight": weight})
    return {"version": 1, "intervalSeconds": interval, "images": images}


def write_home_config(data: dict) -> None:
    atomic_write(
        HOME_PATH,
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def update_home_config(payload: dict) -> dict:
    with LOCK:
        data = validate_home_config(payload)
        write_home_config(data)
        auto_commit([HOME_PATH], "docs: 更新首页图片配置")
        return {"ok": True, "config": data}


def add_home_image(payload: dict, image: bytes) -> dict:
    with LOCK:
        filename = str(payload.get("filename") or "").strip()
        if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
            raise ApiError(400, "图片文件名无效")
        if len(filename) > 160:
            raise ApiError(400, "图片文件名不能超过 160 个字符")
        if any(ord(character) < 32 for character in filename):
            raise ApiError(400, "图片文件名包含非法字符")
        if Path(filename).suffix.lower() not in (".png", ".jpg", ".jpeg"):
            raise ApiError(400, "只支持 .png、.jpg、.jpeg 图片")
        if not image:
            raise ApiError(400, "图片文件不能为空")
        raw_weight = payload.get("weight", 1)
        if isinstance(raw_weight, bool) or not isinstance(raw_weight, (int, float)):
            raise ApiError(400, "图片权重必须是数字")
        weight = float(raw_weight)
        if not math.isfinite(weight) or weight <= 0 or weight > 1_000_000:
            raise ApiError(400, "图片权重必须大于 0 且不超过 1000000")
        if weight.is_integer():
            weight = int(weight)

        HOME_DIR.mkdir(parents=True, exist_ok=True)
        target = HOME_DIR / filename
        if target.exists():
            raise ApiError(409, "home 目录中已存在同名图片")
        image_item = {"file": filename, "weight": weight}
        try:
            atomic_write_bytes(target, image)
            data = read_home_config()
            data["images"].append(image_item)
            write_home_config(data)
        except Exception:
            if target.exists():
                target.unlink()
            raise
        log_change(f"首页图片上传完成：{filename}（Git 提交转到后台）")
        commit_in_background(
            [target, HOME_PATH],
            f"docs: 添加首页图片「{filename}」",
            f"首页图片上传：{filename}",
        )
        return {
            "ok": True,
            "image": image_item,
            "config": data,
            "commit": {"committed": False, "pending": True},
        }


def delete_home_image(filename: str) -> dict:
    filename = str(filename or "").strip()
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ApiError(400, "图片文件名无效")
    if Path(filename).suffix.lower() not in (".png", ".jpg", ".jpeg"):
        raise ApiError(400, "只支持 .png、.jpg、.jpeg 图片")
    with LOCK:
        target = HOME_DIR / filename
        if not target.is_file():
            raise ApiError(404, "图片不存在")
        data = read_home_config()
        remaining = [item for item in data["images"] if item.get("file") != filename]
        if len(remaining) == len(data["images"]):
            raise ApiError(404, "图片不在首页配置中")
        image_snapshot = target.read_bytes()
        config_snapshot = HOME_PATH.read_bytes()
        try:
            data["images"] = remaining
            write_home_config(data)
            target.unlink()
        except Exception:
            atomic_write_bytes(target, image_snapshot)
            atomic_write(HOME_PATH, config_snapshot.decode("utf-8"))
            raise
        log_change(f"首页图片删除完成：{filename}（Git 提交转到后台）")
        commit_in_background(
            [target, HOME_PATH],
            f"docs: 删除首页图片「{filename}」",
            f"首页图片删除：{filename}",
        )
        return {
            "ok": True,
            "deleted": filename,
            "config": data,
            "commit": {"committed": False, "pending": True},
        }


def upload_article_icon(slug: str, filename: str, image: bytes) -> dict:
    suffix = Path(filename).suffix.lower()
    if suffix not in (".png", ".jpg", ".jpeg"):
        raise ApiError(400, "只支持 .png、.jpg、.jpeg 图片")
    if not image:
        raise ApiError(400, "封面图片不能为空")
    with LOCK:
        record = article_map(read_manifest()).get(slug)
        if record is None:
            raise ApiError(404, "文章不存在")
        ARTICLE_ICON_DIR.mkdir(parents=True, exist_ok=True)
        target = ARTICLE_ICON_DIR / f"{slug}{suffix}"
        existing = {
            path: path.read_bytes()
            for path in ARTICLE_ICON_DIR.glob(f"{slug}.*")
            if path.is_file()
        }
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        try:
            atomic_write_bytes(target, image)
            for old_path in existing:
                if old_path != target and old_path.exists():
                    old_path.unlink()
            output = run_build()
        except Exception as exc:
            for old_path in ARTICLE_ICON_DIR.glob(f"{slug}.*"):
                if old_path not in existing and old_path.exists():
                    old_path.unlink()
            restore_files(existing)
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"上传封面失败：{exc}")
        commit = auto_commit(
            [target, DATA_PATH],
            f"docs: 更新「{record.get('title', slug)}」封面",
        )
        log_change(
            f"文章封面更新：{record.get('title', slug)}（文件={target.name}，"
            f"本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "icon": f"/article/icon/{target.name}",
            "message": build_output_message(output),
            "commit": commit,
        }


def read_history_config() -> dict:
    if not HISTORY_PATH.is_file():
        return {"version": 1, "articles": {}}
    try:
        data = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ApiError(500, f"无法读取 article/history.json: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("articles"), dict):
        raise ApiError(500, "article/history.json 格式无效")
    return data


def write_history_config(config: dict) -> None:
    atomic_write(
        HISTORY_PATH,
        json.dumps(config, ensure_ascii=False, indent=2) + "\n",
    )


def run_git(arguments: list[str], timeout: int = 20) -> str:
    try:
        result = subprocess.run(
            ["git", "-c", "core.quotepath=false", *arguments],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
    except FileNotFoundError:
        raise ApiError(500, "未找到 Git 命令")
    except subprocess.TimeoutExpired:
        raise ApiError(500, "Git 操作超时")
    if result.returncode != 0:
        raise ApiError(500, git_error_text(result, "Git 操作失败"))
    return result.stdout or ""


def require_history_record(slug: str) -> dict:
    record = article_map(read_manifest()).get(slug)
    if record is None:
        raise ApiError(404, "文章不存在")
    return record


def article_history_versions(record: dict) -> tuple[list[dict], str | None]:
    path = article_path(record)
    relative = path.relative_to(ROOT).as_posix()
    output = run_git(
        [
            "log",
            "--follow",
            "--format=%H%x1f%an%x1f%ad%x1f%s",
            "--date=iso-strict",
            "--name-only",
            "--",
            relative,
        ]
    )
    versions = []
    current = None
    for raw_line in output.splitlines():
        line = raw_line.rstrip("\r")
        if re.match(r"^[0-9a-fA-F]{40}\x1f", line):
            parts = line.split("\x1f", 3)
            current = {
                "hash": parts[0],
                "author": parts[1] if len(parts) > 1 else "",
                "date": parts[2] if len(parts) > 2 else "",
                "subject": parts[3] if len(parts) > 3 else "",
            }
        elif current is not None and line.strip():
            current["path"] = line.strip()
            versions.append(current)
            current = None

    for index, version in enumerate(versions):
        version["shortHash"] = version["hash"][:7]
        version["current"] = index == 0

    config = read_history_config()
    entry = config["articles"].get(record["slug"])
    configured = entry.get("earliest") if isinstance(entry, dict) else None
    hashes = {version["hash"] for version in versions}
    cutoff = configured if isinstance(configured, str) and configured in hashes else None
    cutoff_index = next(
        (index for index, version in enumerate(versions) if version["hash"] == cutoff),
        None,
    )
    for index, version in enumerate(versions):
        version["visible"] = cutoff_index is None or index <= cutoff_index
    return versions, cutoff


def article_history_detail(slug: str, commit_hash: str) -> dict:
    if not HISTORY_HASH_RE.fullmatch(commit_hash):
        raise ApiError(400, "版本号格式无效")
    record = require_history_record(slug)
    versions, _ = article_history_versions(record)
    version = next(
        (item for item in versions if item["hash"].lower().startswith(commit_hash.lower())),
        None,
    )
    if version is None:
        raise ApiError(404, "找不到该版本")
    path = version["path"]
    raw = run_git(["show", f"{version['hash']}:{path}"], timeout=30)
    front = {}
    body = raw
    try:
        front, body = build.split_front_matter(raw, f"{path}@{version['shortHash']}")
        body = build.strip_title_and_excerpt(
            body,
            str(front.get("title") or record.get("title") or ""),
            str(front.get("description") or record.get("description") or ""),
            f"{path}@{version['shortHash']}",
        )
    except build.BuildError:
        body = raw
    title = front.get("title") if isinstance(front.get("title"), str) else record.get("title", "")
    description = (
        front.get("description")
        if isinstance(front.get("description"), str)
        else record.get("description", "")
    )
    tags = front.get("tags") if isinstance(front.get("tags"), list) else record.get("tags", [])
    return {
        "hash": version["hash"],
        "shortHash": version["shortHash"],
        "author": version["author"],
        "date": version["date"],
        "subject": version["subject"],
        "title": title,
        "description": description,
        "emoji": front.get("emoji") if isinstance(front.get("emoji"), str) else record.get("emoji", ""),
        "updated": str(front.get("updated") or record.get("updated") or ""),
        "readingTime": front.get("reading_time")
        if isinstance(front.get("reading_time"), int)
        else record.get("readingTime", 1),
        "tags": tags,
        "body": body.strip(),
    }


def set_history_earliest(slug: str, commit_hash: str | None, author: str | None = None) -> dict:
    record = require_history_record(slug)
    versions, _ = article_history_versions(record)
    selected = None
    if commit_hash:
        if not isinstance(commit_hash, str) or not HISTORY_HASH_RE.fullmatch(commit_hash):
            raise ApiError(400, "版本号格式无效")
        selected = next(
            (item for item in versions if item["hash"].lower().startswith(commit_hash.lower())),
            None,
        )
        if selected is None:
            raise ApiError(400, "该版本不属于这篇文章")
    with LOCK:
        config = read_history_config()
        articles = config.setdefault("articles", {})
        if selected is None:
            articles.pop(slug, None)
        else:
            articles[slug] = {"earliest": selected["hash"]}
        write_history_config(config)
        commit = auto_commit(
            [HISTORY_PATH],
            "docs: 设置最早可见版本" if selected else "docs: 清除最早可见版本",
            author,
        )
    return {
        "ok": True,
        "earliest": selected["hash"] if selected else None,
        "commit": commit,
    }


def signature_record(
    author: str,
    action: str,
    title: str,
    topic: str,
    from_topic: str | None = None,
) -> dict:
    record = {
        "author": author,
        "at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "action": action,
        "title": title,
        "topic": topic,
    }
    if from_topic:
        record["fromTopic"] = from_topic
    return record


def edits_snapshot() -> bytes | None:
    return EDITS_PATH.read_bytes() if EDITS_PATH.is_file() else None


def restore_edits(snapshot: bytes | None) -> None:
    if snapshot is None:
        if EDITS_PATH.exists():
            EDITS_PATH.unlink()
    else:
        atomic_write(EDITS_PATH, snapshot.decode("utf-8"))


def ordered_topics(topics: list[dict]) -> list[dict]:
    top_level = [topic for topic in topics if not topic.get("parentId")]
    top_level.sort(key=lambda topic: (int(topic.get("order", 0)), str(topic.get("id"))))
    children: dict[str, list[dict]] = {}
    for topic in topics:
        parent_id = topic.get("parentId")
        if parent_id:
            children.setdefault(parent_id, []).append(topic)
    for items in children.values():
        items.sort(key=lambda topic: (int(topic.get("order", 0)), str(topic.get("id"))))
    ordered = []

    def append_children(parent_id: str) -> None:
        for child in children.get(parent_id, []):
            ordered.append(child)
            append_children(child["id"])

    for topic in top_level:
        ordered.append(topic)
        append_children(topic["id"])
    return ordered


def refresh_manifest(manifest: dict) -> None:
    topics = [topic for topic in manifest["topics"] if isinstance(topic, dict)]
    articles = [article for article in manifest["articles"] if isinstance(article, dict)]
    topics = ordered_topics(topics)
    articles.sort(key=lambda article: (int(article.get("order", 0)), str(article.get("slug"))))

    counts: dict[str, int] = {}
    for article in articles:
        topic_id = article.get("topic")
        counts[topic_id] = counts.get(topic_id, 0) + 1
    for topic in topics:
        topic["articleCount"] = counts.get(topic["id"], 0)

    manifest["topics"] = topics
    manifest["articles"] = articles
    manifest["topicCount"] = len(topics)
    manifest["articleCount"] = len(articles)
    dates = [str(article["updated"]) for article in articles if article.get("updated")]
    manifest["lastUpdated"] = max(dates) if dates else date.today().isoformat()


def require_text(value: object, field: str, max_length: int = 500, multiline: bool = False) -> str:
    if not isinstance(value, str):
        raise ApiError(400, f"{field} 必须是字符串")
    if "\x00" in value:
        raise ApiError(400, f"{field} 包含非法字符")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    if not multiline:
        value = re.sub(r"\s+", " ", value)
    value = value.strip()
    if not value:
        raise ApiError(400, f"{field} 不能为空")
    if len(value) > max_length:
        raise ApiError(400, f"{field} 不能超过 {max_length} 个字符")
    return value


def require_slug(value: object, field: str = "slug") -> str:
    slug = require_text(value, field, 64)
    if not SLUG_RE.fullmatch(slug):
        raise ApiError(400, f"{field} 只能包含小写字母、数字和连字符，且不能以连字符开头")
    return slug


def require_date(value: object) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ApiError(400, "updated 必须是 YYYY-MM-DD")
    try:
        date.fromisoformat(value)
    except ValueError:
        raise ApiError(400, "updated 不是有效日期")
    return value


def require_reading_time(value: object) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ApiError(400, "readingTime 必须是整数")
    if number < 1 or number > 240:
        raise ApiError(400, "readingTime 必须在 1–240 分钟之间")
    return number


def require_tags(value: object) -> list[str]:
    if isinstance(value, str):
        values = value.split(",")
    elif isinstance(value, list):
        values = value
    else:
        raise ApiError(400, "tags 必须是字符串数组")
    tags: list[str] = []
    seen = set()
    for item in values:
        if not isinstance(item, str):
            raise ApiError(400, "tags 中每一项都必须是字符串")
        tag = re.sub(r"\s+", " ", item).strip()
        if not tag:
            continue
        if len(tag) > 32:
            raise ApiError(400, "单个标签不能超过 32 个字符")
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)
    if len(tags) > 16:
        raise ApiError(400, "标签最多 16 个")
    return tags


def require_body(value: object) -> str:
    if not isinstance(value, str):
        raise ApiError(400, "body 必须是字符串")
    value = value.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not value:
        raise ApiError(400, "正文不能为空")
    if len(value) > MAX_BODY_CHARS:
        raise ApiError(400, f"正文不能超过 {MAX_BODY_CHARS} 个字符")
    return value


def validate_article_fields(payload: dict, defaults: dict | None = None) -> dict:
    defaults = defaults or {}

    def get(key: str, fallback_key: str | None = None):
        if key in payload:
            return payload[key]
        if fallback_key and fallback_key in defaults:
            return defaults[fallback_key]
        return defaults.get(key)

    title = require_text(get("title"), "title", 200)
    description = require_text(get("description"), "description", 500)
    emoji = require_text(get("emoji"), "emoji", 8)
    updated = require_date(get("updated"))
    reading_time = require_reading_time(get("readingTime", "readingTime"))
    tags = require_tags(get("tags"))
    body = require_body(get("body"))
    return {
        "title": title,
        "description": description,
        "emoji": emoji,
        "updated": updated,
        "reading_time": reading_time,
        "tags": tags,
        "body": body,
    }


def compose_markdown(record: dict, topic: dict, body: str) -> str:
    source = f"/wiki/#/doc/{record['slug']}"
    frontmatter = [
        "---",
        f"title: {json.dumps(record['title'], ensure_ascii=False)}",
        f"description: {json.dumps(record['description'], ensure_ascii=False)}",
        f"topic: {json.dumps(topic['name'], ensure_ascii=False)}",
        f"topic_id: {json.dumps(topic['id'], ensure_ascii=False)}",
        f"updated: {json.dumps(record['updated'], ensure_ascii=False)}",
        f"reading_time: {record['readingTime']}",
        f"emoji: {json.dumps(record['emoji'], ensure_ascii=False)}",
        f"order: {record['order']}",
        f"slug: {json.dumps(record['slug'], ensure_ascii=False)}",
        f"source: \"{source}\"",
        "tags:",
    ]
    for tag in record["tags"]:
        frontmatter.append(f"  - {json.dumps(tag, ensure_ascii=False)}")
    frontmatter.append("---")
    return "\n".join(frontmatter) + f"\n\n# {record['title']}\n\n{body.strip()}\n"


def article_path(record: dict) -> Path:
    path = (ARTICLE_DIR / record["file"]).resolve()
    try:
        path.relative_to(ARTICLE_DIR.resolve())
    except ValueError:
        raise ApiError(500, "文章路径不在 article/ 内")
    return path


def read_article(slug: str) -> dict:
    manifest = read_manifest()
    records = article_map(manifest)
    record = records.get(slug)
    if record is None:
        raise ApiError(404, "文章不存在")
    path = article_path(record)
    if not path.is_file():
        raise ApiError(404, "文章 Markdown 文件不存在")
    relative = path.relative_to(ROOT).as_posix()
    try:
        front, body = build.split_front_matter(path.read_text(encoding="utf-8"), relative)
        body = build.strip_title_and_excerpt(body, front["title"], front["description"], relative)
    except build.BuildError as exc:
        raise ApiError(500, str(exc))
    result = dict(record)
    result["body"] = body
    result["topicName"] = topic_map(manifest).get(record["topic"], {}).get("name", record["topic"])
    result["signatures"] = read_edits().get("articles", {}).get(slug, [])
    return result


def public_state(manifest: dict) -> dict:
    topics = [dict(topic) for topic in manifest["topics"]]
    for topic in topics:
        topic["parentId"] = topic.get("parentId") or None
    topics = ordered_topics(topics)
    articles = []
    for article in sorted(manifest["articles"], key=lambda item: (int(item.get("order", 0)), item["slug"])):
        item = dict(article)
        item["topicName"] = next(
            (topic["name"] for topic in topics if topic["id"] == item.get("topic")),
            item.get("topic", ""),
        )
        articles.append(item)
    return {
        "site": manifest.get("site", {}),
        "topics": topics,
        "articles": articles,
    }


def snapshot_files(paths: list[Path]) -> dict[Path, bytes | None]:
    snapshot = {}
    for path in paths:
        snapshot[path] = path.read_bytes() if path.is_file() else None
    return snapshot


def restore_files(snapshot: dict[Path, bytes | None]) -> None:
    for path, content in snapshot.items():
        if content is None:
            if path.exists():
                path.unlink()
        else:
            atomic_write(path, content.decode("utf-8"))


def build_timeout_seconds() -> float:
    try:
        value = float(os.environ.get("BUILD_TIMEOUT", "90"))
    except (TypeError, ValueError):
        value = 90
    return max(5, min(value, 3600))


def run_build() -> str:
    timeout = build_timeout_seconds()
    try:
        result = subprocess.run(
            [sys.executable, str(BUILD_SCRIPT)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        partial = ""
        for value in (exc.stderr, exc.stdout):
            if value:
                text = value.decode("utf-8", "replace") if isinstance(value, bytes) else str(value)
                partial = text.strip()
                if partial:
                    break
        detail = f"（{timeout:g} 秒）"
        if partial:
            detail += "\n" + partial[-2000:]
        raise ApiError(500, "build.py 超时" + detail)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "未知错误").strip()
        if len(detail) > 2000:
            detail = detail[-2000:]
        raise ApiError(400, "构建失败：" + detail)
    return (result.stdout or "").strip()


def build_output_message(output: str) -> str:
    return output.splitlines()[-1] if output else "构建完成"


def log_change(message: str) -> None:
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
    print(f"[{timestamp}] {message}", flush=True)


def git_error_text(result: subprocess.CompletedProcess, fallback: str) -> str:
    lines = []
    for line in f"{result.stderr or ''}\n{result.stdout or ''}".splitlines():
        value = line.strip()
        if not value or value.lower().startswith(("warning:", "hint:")):
            continue
        lines.append(value)
    return ("\n".join(lines) or fallback)[-1000:]


def git_path_is_committable(relative: str) -> bool:
    if (ROOT / relative).exists():
        return True
    result = subprocess.run(
        ["git", "ls-files", "--", relative],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=10,
    )
    return result.returncode == 0 and bool(result.stdout.strip())


def git_config_value(key: str) -> str:
    try:
        result = subprocess.run(
            ["git", "config", "--get", key],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""
    return (result.stdout or "").strip() if result.returncode == 0 else ""


def clean_git_identity(value: str | None, fallback: str) -> str:
    cleaned = " ".join(str(value or "").split()).strip()
    return cleaned or fallback


PUSH_EVENT = threading.Event()
PUSH_GUARD = threading.Lock()
PUSH_THREAD = None


def auto_push_enabled() -> bool:
    return os.environ.get("AUTO_PUSH", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def auto_push_once() -> None:
    try:
        branch_result = subprocess.run(
            ["git", "symbolic-ref", "--short", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        branch = (branch_result.stdout or "").strip()
        if branch_result.returncode != 0 or not branch:
            log_change("自动 push 跳过：当前不在分支上")
            return
        remote_result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        if remote_result.returncode != 0 or not (remote_result.stdout or "").strip():
            log_change("自动 push 跳过：未配置 origin")
            return
        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"
        result = subprocess.run(
            ["git", "push", "origin", branch],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=90,
            env=env,
        )
        if result.returncode == 0:
            log_change(f"自动 push 完成：{branch}")
        else:
            log_change(f"自动 push 失败：{git_error_text(result, 'git push 失败')}")
    except FileNotFoundError:
        log_change("自动 push 跳过：未找到 Git 命令")
    except subprocess.TimeoutExpired:
        log_change("自动 push 失败：Git 操作超时")
    except Exception as exc:
        log_change(f"自动 push 失败：{exc}")


def auto_push_worker() -> None:
    global PUSH_THREAD
    while True:
        PUSH_EVENT.wait()
        PUSH_EVENT.clear()
        auto_push_once()
        with PUSH_GUARD:
            if not PUSH_EVENT.is_set():
                PUSH_THREAD = None
                return


def schedule_auto_push() -> None:
    global PUSH_THREAD
    if not auto_push_enabled():
        return
    with PUSH_GUARD:
        PUSH_EVENT.set()
        if PUSH_THREAD is not None and PUSH_THREAD.is_alive():
            return
        PUSH_THREAD = threading.Thread(
            target=auto_push_worker,
            name="happydays-auto-push",
            daemon=True,
        )
        PUSH_THREAD.start()


def auto_commit(paths: list[Path], message: str, author: str | None = None) -> dict:
    """Create a local Git commit and schedule a background push."""
    if not (ROOT / ".git").exists():
        return {"committed": False, "skipped": "当前目录不是 Git 仓库"}

    relative_paths = []
    for path in paths:
        try:
            relative = path.resolve().relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            continue
        if relative in relative_paths:
            continue
        if not git_path_is_committable(relative):
            continue
        relative_paths.append(relative)
    if not relative_paths:
        return {"committed": False, "skipped": "没有可提交的路径"}

    git_name = clean_git_identity(author, clean_git_identity(git_config_value("user.name"), "HappyDays Wiki"))
    git_email = clean_git_identity(git_config_value("user.email"), "happydays@localhost")
    if "@" not in git_email:
        git_email = "happydays@localhost"
    git_options = [
        "-c", "core.autocrlf=false",
        "-c", "core.safecrlf=false",
        "-c", f"user.name={git_name}",
        "-c", f"user.email={git_email}",
    ]
    try:
        add_result = subprocess.run(
            ["git", *git_options, "add", "-A", "--", *relative_paths],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
        )
        if add_result.returncode != 0:
            return {
                "committed": False,
                "error": git_error_text(add_result, "git add 失败"),
            }

        diff_result = subprocess.run(
            ["git", *git_options, "diff", "--cached", "--quiet", "--", *relative_paths],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if diff_result.returncode == 0:
            return {"committed": False, "skipped": "没有文件变更"}
        if diff_result.returncode != 1:
            return {"committed": False, "error": "无法检查 Git 暂存区"}

        commit_result = subprocess.run(
            ["git", *git_options, "commit", "-m", message, "--", *relative_paths],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
        )
        if commit_result.returncode != 0:
            return {
                "committed": False,
                "error": git_error_text(commit_result, "git commit 失败"),
            }

        hash_result = subprocess.run(
            ["git", *git_options, "rev-parse", "--short", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        commit_hash = (hash_result.stdout or "").strip() if hash_result.returncode == 0 else ""
        schedule_auto_push()
        return {"committed": True, "hash": commit_hash, "message": message}
    except FileNotFoundError:
        return {"committed": False, "skipped": "未找到 Git 命令"}
    except subprocess.TimeoutExpired:
        return {"committed": False, "error": "Git 操作超时"}


def commit_in_background(paths: list[Path], message: str, label: str) -> None:
    def worker() -> None:
        commit = auto_commit(paths, message)
        log_change(
            f"{label}（本地提交={'是' if commit.get('committed') else '否'}）"
        )

    threading.Thread(target=worker, daemon=True).start()


def normalize_title_runs(item: dict) -> tuple[str, list[dict]]:
    raw_runs = item.get("runs")
    if raw_runs is None:
        text = require_text(item.get("text"), "标题", 80)
        return text, [
            {
                "text": text,
                "bold": False,
                "italic": False,
                "underline": False,
                "strike": False,
                "color": "",
            }
        ]
    if not isinstance(raw_runs, list) or not raw_runs:
        raise ApiError(400, "标题 runs 不能为空")

    runs = []
    total = ""
    for raw in raw_runs:
        if not isinstance(raw, dict):
            raise ApiError(400, "标题 run 格式无效")
        text = raw.get("text")
        if not isinstance(text, str) or not text:
            raise ApiError(400, "标题 run 文本不能为空")
        if "\n" in text or "\r" in text:
            raise ApiError(400, "标题不能包含换行")
        total += text
        if len(total) > 80:
            raise ApiError(400, "标题不能超过 80 个字符")
        color = str(raw.get("color") or "").strip().lower()
        if color and not TITLE_COLOR_RE.fullmatch(color):
            raise ApiError(400, "标题颜色必须是 #RRGGBB")
        size = raw.get("size", 0)
        if size in (None, ""):
            size = 0
        elif isinstance(size, bool) or not isinstance(size, (int, float)):
            raise ApiError(400, "标题字号必须是数字")
        else:
            size = float(size)
            if not math.isfinite(size) or (size != 0 and not 8 <= size <= 80):
                raise ApiError(400, "标题单字字号必须在 8–80px 之间")
            if size.is_integer():
                size = int(size)
        run = {
            "text": text,
            "bold": bool(raw.get("bold")),
            "italic": bool(raw.get("italic")),
            "underline": bool(raw.get("underline")),
            "strike": bool(raw.get("strike")),
            "color": color,
        }
        if size:
            run["size"] = size
        runs.append(run)
    if not total.strip():
        raise ApiError(400, "标题不能为空")

    merged = []
    for run in runs:
        previous = merged[-1] if merged else None
        if previous and all(
            previous.get(field, 0) == run.get(field, 0)
            for field in ("bold", "italic", "underline", "strike", "color", "size")
        ):
            previous["text"] += run["text"]
        else:
            merged.append(run)
    return total, merged


def update_titles(payload: dict) -> dict:
    with LOCK:
        raw_titles = payload.get("titles")
        if not isinstance(raw_titles, list) or not raw_titles:
            raise ApiError(400, "标题列表不能为空")
        if len(raw_titles) > 30:
            raise ApiError(400, "标题最多 30 条")
        titles = []
        for item in raw_titles:
            if not isinstance(item, dict):
                raise ApiError(400, "标题条目格式无效")
            text, runs = normalize_title_runs(item)
            weight = item.get("weight")
            if isinstance(weight, bool) or not isinstance(weight, (int, float)):
                raise ApiError(400, "标题权重必须是数字")
            weight = float(weight)
            if not math.isfinite(weight) or weight <= 0 or weight > 1_000_000:
                raise ApiError(400, "标题权重必须大于 0 且不超过 1000000")
            if weight.is_integer():
                weight = int(weight)
            titles.append({"text": text, "weight": weight, "runs": runs})

        font_size = payload.get("fontSize", 16)
        if isinstance(font_size, bool) or not isinstance(font_size, (int, float)):
            raise ApiError(400, "字号必须是数字")
        font_size = float(font_size)
        if not math.isfinite(font_size) or font_size < 8 or font_size > 40:
            raise ApiError(400, "字号必须在 8 到 40 之间")
        if font_size.is_integer():
            font_size = int(font_size)

        interval_seconds = payload.get("intervalSeconds", 10)
        if isinstance(interval_seconds, bool) or not isinstance(interval_seconds, (int, float)):
            raise ApiError(400, "轮换时间必须是数字")
        interval_seconds = float(interval_seconds)
        if not math.isfinite(interval_seconds) or interval_seconds < 3 or interval_seconds > 3600:
            raise ApiError(400, "轮换时间必须在 3 到 3600 秒之间")
        if interval_seconds.is_integer():
            interval_seconds = int(interval_seconds)

        author_raw = payload.get("author")
        author = (
            require_text(author_raw, "author", 60)
            if isinstance(author_raw, str) and author_raw.strip()
            else "HappyDays 团队"
        )
        snapshot = TITLE_PATH.read_bytes() if TITLE_PATH.is_file() else None
        try:
            atomic_write(
                TITLE_PATH,
                json.dumps(
                    {
                        "fontSize": font_size,
                        "intervalSeconds": interval_seconds,
                        "titles": titles,
                    },
                    ensure_ascii=False,
                    indent=2,
                ) + "\n",
            )
        except Exception as exc:
            if snapshot is not None:
                atomic_write(TITLE_PATH, snapshot.decode("utf-8"))
            raise ApiError(500, f"保存标题失败：{exc}")

        commit = auto_commit(
            [TITLE_PATH],
            f"docs: 更新页眉标题（{author}）",
            author,
        )
        log_change(
            f"页眉标题更新（作者={author}，共 {len(titles)} 条，"
            f"字号={font_size}px，轮换={interval_seconds}s，"
            f"本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "fontSize": font_size,
            "intervalSeconds": interval_seconds,
            "titles": titles,
            "message": "页眉标题已保存",
            "commit": commit,
        }


def relocate_markdown_paths(markdown: str, old_path: Path, new_path: Path) -> str:
    if old_path.parent == new_path.parent:
        return markdown
    old_parent = old_path.parent.resolve()
    new_parent = new_path.parent.resolve()
    root = ROOT.resolve()

    def relocate(target: str) -> str:
        if not target or target.startswith(
            ("#", "/", "//", "http://", "https://", "mailto:", "data:")
        ):
            return target
        clean, separator, fragment = target.partition("#")
        if not clean:
            return target
        resolved = (old_parent / clean).resolve()
        try:
            resolved.relative_to(root)
        except ValueError:
            return target
        relative = os.path.relpath(resolved, new_parent).replace("\\", "/")
        return relative + (separator + fragment if separator else "")

    image_pattern = re.compile(
        r"(!\[[^\]]*\]\()([^)\s]+)(\s+[\"'][^\"']*[\"'])?(\))"
    )
    link_pattern = re.compile(
        r"(?<!!)(\[[^\]]+\]\()([^)\s]+)(\s+[\"'][^\"']*[\"'])?(\))"
    )
    markdown = image_pattern.sub(
        lambda match: match.group(1) + relocate(match.group(2)) + (match.group(3) or "") + match.group(4),
        markdown,
    )
    markdown = link_pattern.sub(
        lambda match: match.group(1) + relocate(match.group(2)) + (match.group(3) or "") + match.group(4),
        markdown,
    )
    return markdown


def update_article(slug: str, payload: dict) -> dict:
    with LOCK:
        manifest = read_manifest()
        records = article_map(manifest)
        record = records.get(slug)
        if record is None:
            raise ApiError(404, "文章不存在")
        topics = topic_map(manifest)
        topic = topics.get(record["topic"])
        if topic is None:
            raise ApiError(500, "文章主题不存在")
        topic_id = payload.get("topicId", record["topic"])
        if not isinstance(topic_id, str):
            raise ApiError(400, "topicId 必须是字符串")
        topic_id = require_text(topic_id, "topicId", 64)
        target_topic = topics.get(topic_id)
        if target_topic is None:
            raise ApiError(400, "目标主题不存在")
        author = require_text(payload.get("author"), "author", 60)
        fields = validate_article_fields(payload, {
            "title": record.get("title"),
            "description": record.get("description"),
            "emoji": record.get("emoji"),
            "updated": record.get("updated"),
            "readingTime": record.get("readingTime"),
            "tags": record.get("tags"),
        })
        body = fields.pop("body")
        old_path = article_path(record)
        new_file = f"{target_topic['directory']}/{slug}.md"
        new_path = (ARTICLE_DIR / new_file).resolve()
        try:
            new_path.relative_to(ARTICLE_DIR.resolve())
        except ValueError:
            raise ApiError(400, "目标文章路径无效")
        if new_path != old_path and new_path.exists():
            raise ApiError(409, "目标主题下已存在同名文章文件")
        file_snapshot = {old_path: old_path.read_bytes() if old_path.is_file() else None}
        if new_path != old_path:
            file_snapshot[new_path] = None
        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        edits_snapshot_bytes = edits_snapshot()

        updated = dict(record)
        updated.update({
            "title": fields["title"],
            "description": fields["description"],
            "emoji": fields["emoji"],
            "updated": fields["updated"],
            "readingTime": fields["reading_time"],
            "tags": fields["tags"],
            "topic": topic_id,
            "file": new_file,
        })
        for index, item in enumerate(manifest["articles"]):
            if item.get("slug") == slug:
                manifest["articles"][index] = updated
                break
        refresh_manifest(manifest)
        body = relocate_markdown_paths(body, old_path, new_path)
        markdown = compose_markdown(updated, target_topic, body)
        moved = topic_id != record["topic"]
        edits = read_edits()
        edits.setdefault("articles", {}).setdefault(slug, []).append(
            signature_record(
                author,
                "move" if moved else "update",
                updated["title"],
                target_topic["name"],
                topic["name"] if moved else None,
            )
        )

        try:
            if new_path != old_path:
                atomic_write(new_path, markdown)
                if old_path.exists():
                    old_path.unlink()
            else:
                atomic_write(old_path, markdown)
            write_manifest(manifest)
            write_edits(edits)
            output = run_build()
        except Exception as exc:
            if old_path.exists():
                old_path.unlink()
            if new_path != old_path and new_path.exists():
                new_path.unlink()
            restore_files(file_snapshot)
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            restore_edits(edits_snapshot_bytes)
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"保存失败：{exc}")

        commit_message = (
            f"docs: 移动「{updated['title']}」到「{target_topic['name']}」（{author}）"
            if moved
            else f"docs: 更新「{updated['title']}」（{author}）"
        )
        commit = auto_commit(
            [old_path, new_path, MANIFEST_PATH, DATA_PATH, EDITS_PATH],
            commit_message,
            author,
        )
        log_change(
            f"文章{'移动' if moved else '更新'}：{updated['title']}"
            f"（slug={slug}，作者={author}，主题={target_topic['name']}，"
            f"本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "article": updated,
            "message": build_output_message(output),
            "commit": commit,
        }


def move_article_order(slug: str, payload: dict) -> dict:
    direction = payload.get("direction")
    if direction not in ("up", "down"):
        raise ApiError(400, "direction 必须是 up 或 down")
    author = require_text(payload.get("author"), "署名", 80)
    with LOCK:
        manifest = read_manifest()
        records = article_map(manifest)
        record = records.get(slug)
        if record is None:
            raise ApiError(404, "文章不存在")
        siblings = sorted(
            (item for item in manifest["articles"] if item.get("topic") == record.get("topic")),
            key=lambda item: (int(item.get("order", 0)), str(item.get("slug", ""))),
        )
        index = next(
            (i for i, item in enumerate(siblings) if item.get("slug") == slug),
            None,
        )
        if index is None:
            raise ApiError(404, "文章不在主题列表中")
        target_index = index - 1 if direction == "up" else index + 1
        if target_index < 0 or target_index >= len(siblings):
            return {"ok": True, "moved": False, "article": record}
        other = siblings[target_index]
        path = article_path(record)
        other_path = article_path(other)
        snapshots = {
            path: path.read_bytes() if path.is_file() else None,
            other_path: other_path.read_bytes() if other_path.is_file() else None,
        }
        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        edits_snapshot_bytes = edits_snapshot()

        record_order = int(record.get("order", 0))
        other_order = int(other.get("order", 0))
        record["order"], other["order"] = other_order, record_order

        def rewrite_order(markdown_path, order):
            raw = markdown_path.read_text(encoding="utf-8")
            updated, count = re.subn(
                r"(?m)^order:\s*\d+\s*$",
                f"order: {order}",
                raw,
                count=1,
            )
            if count != 1:
                raise ApiError(500, f"无法更新 {markdown_path.name} 的 order")
            atomic_write(markdown_path, updated)

        edits = read_edits()
        edits.setdefault("articles", {}).setdefault(slug, []).append(
            signature_record(author, "update", record.get("title", slug), record.get("topic", ""))
        )
        try:
            rewrite_order(path, record["order"])
            rewrite_order(other_path, other["order"])
            write_manifest(manifest)
            write_edits(edits)
            output = run_build()
        except Exception as exc:
            restore_files(snapshots)
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            restore_edits(edits_snapshot_bytes)
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"调整顺序失败：{exc}")

        commit = auto_commit(
            [path, other_path, MANIFEST_PATH, DATA_PATH, EDITS_PATH],
            f"docs: 调整「{record.get('title', slug)}」顺序（{author}）",
            author,
        )
        log_change(
            f"文章排序：{record.get('title', slug)}（slug={slug}，"
            f"方向={direction}，本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "moved": True,
            "article": record,
            "message": build_output_message(output),
            "commit": commit,
        }


def delete_article(slug: str) -> dict:
    with LOCK:
        manifest = read_manifest()
        records = article_map(manifest)
        record = records.get(slug)
        if record is None:
            raise ApiError(404, "文章不存在")
        path = article_path(record)
        file_snapshot = path.read_bytes() if path.is_file() else None
        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        edits_snapshot_bytes = edits_snapshot()
        edits = read_edits()
        edits.setdefault("articles", {}).pop(slug, None)
        image_source = (IMAGE_DIR / slug).resolve()
        image_trash = None
        try:
            image_source.relative_to(IMAGE_DIR.resolve())
        except ValueError:
            raise ApiError(400, "文章图片目录无效")
        if image_source.is_dir():
            image_trash = image_source.with_name(
                f".{image_source.name}.deleting-{uuid.uuid4().hex}"
            )
            image_source.rename(image_trash)

        try:
            if path.exists():
                path.unlink()
            manifest["articles"] = [
                item for item in manifest["articles"] if item.get("slug") != slug
            ]
            refresh_manifest(manifest)
            write_manifest(manifest)
            write_edits(edits)
            output = run_build()
        except Exception as exc:
            if file_snapshot is not None:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(file_snapshot)
            elif path.exists():
                path.unlink()
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            restore_edits(edits_snapshot_bytes)
            if image_trash is not None and image_trash.exists() and not image_source.exists():
                image_trash.rename(image_source)
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"删除文章失败：{exc}")

        if image_trash is not None:
            try:
                shutil.rmtree(image_trash)
            except OSError as exc:
                print(f"警告：无法清理图片目录 {image_trash}: {exc}", file=sys.stderr)

        commit = auto_commit(
            [path, MANIFEST_PATH, DATA_PATH, EDITS_PATH, image_source],
            f"docs: 删除「{record['title']}」",
        )
        log_change(
            f"文章删除：{record['title']}（slug={slug}，"
            f"本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "slug": slug,
            "message": build_output_message(output),
            "commit": commit,
        }


def delete_topic(topic_id: str) -> dict:
    with LOCK:
        manifest = read_manifest()
        topics = topic_map(manifest)
        topic = topics.get(topic_id)
        if topic is None:
            raise ApiError(404, "主题不存在")
        direct_articles = [
            article for article in manifest["articles"] if article.get("topic") == topic_id
        ]
        if direct_articles:
            raise ApiError(
                409,
                f"主题「{topic['name']}」下还有 {len(direct_articles)} 篇文章，请先删除或移动文章",
            )
        children = [
            item for item in manifest["topics"] if item.get("parentId") == topic_id
        ]
        if children:
            raise ApiError(
                409,
                f"主题「{topic['name']}」下还有 {len(children)} 个下级主题，请先删除下级主题",
            )
        directory = (ARTICLE_DIR / topic["directory"]).resolve()
        try:
            directory.relative_to(ARTICLE_DIR.resolve())
        except ValueError:
            raise ApiError(500, "主题目录无效")
        if directory.exists() and any(directory.iterdir()):
            raise ApiError(409, "主题目录不为空，请先清理目录中的文件")

        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        try:
            manifest["topics"] = [
                item for item in manifest["topics"] if item.get("id") != topic_id
            ]
            refresh_manifest(manifest)
            write_manifest(manifest)
            output = run_build()
        except Exception as exc:
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"删除主题失败：{exc}")

        if directory.exists():
            try:
                directory.rmdir()
            except OSError as exc:
                print(f"警告：无法删除空目录 {directory}: {exc}", file=sys.stderr)

        return {
            "ok": True,
            "topicId": topic_id,
            "message": build_output_message(output),
        }


def create_article(payload: dict) -> dict:
    with LOCK:
        manifest = read_manifest()
        topics = topic_map(manifest)
        topic_id = require_text(payload.get("topicId"), "topicId", 64)
        topic = topics.get(topic_id)
        if topic is None:
            raise ApiError(400, "选择的主題不存在")
        slug = require_slug(payload.get("slug"))
        if slug in article_map(manifest):
            raise ApiError(409, "slug 已存在")
        author = require_text(payload.get("author"), "author", 60)
        fields = validate_article_fields(payload)
        body = fields.pop("body")
        path = (ARTICLE_DIR / topic["directory"] / f"{slug}.md").resolve()
        try:
            path.relative_to(ARTICLE_DIR.resolve())
        except ValueError:
            raise ApiError(400, "文章路径无效")
        if path.exists():
            raise ApiError(409, "文章文件已存在")
        next_order = max((int(item.get("order", 0)) for item in manifest["articles"]), default=0) + 1
        record = {
            "slug": slug,
            "order": next_order,
            "topic": topic_id,
            "title": fields["title"],
            "description": fields["description"],
            "emoji": fields["emoji"],
            "updated": fields["updated"],
            "readingTime": fields["reading_time"],
            "tags": fields["tags"],
            "file": f"{topic['directory']}/{slug}.md",
            "source": f"/wiki/#/doc/{slug}",
        }
        manifest["articles"].append(record)
        refresh_manifest(manifest)
        markdown = compose_markdown(record, topic, body)
        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None
        edits_snapshot_bytes = edits_snapshot()
        edits = read_edits()
        edits.setdefault("articles", {})[slug] = [
            signature_record(
                author,
                "create",
                record["title"],
                topic["name"],
            )
        ]

        try:
            atomic_write(path, markdown)
            write_manifest(manifest)
            write_edits(edits)
            output = run_build()
        except Exception as exc:
            if path.exists():
                path.unlink()
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            restore_edits(edits_snapshot_bytes)
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"创建失败：{exc}")

        commit = auto_commit(
            [path, MANIFEST_PATH, DATA_PATH, EDITS_PATH],
            f"docs: 新建「{record['title']}」（{author}）",
            author,
        )
        log_change(
            f"文章创建：{record['title']}（slug={slug}，作者={author}，"
            f"主题={topic['name']}，本地提交={'是' if commit.get('committed') else '否'}）"
        )
        return {
            "ok": True,
            "article": record,
            "message": build_output_message(output),
            "commit": commit,
        }


def create_topic(payload: dict) -> dict:
    with LOCK:
        manifest = read_manifest()
        topic_id = require_slug(payload.get("id"), "id")
        name = require_text(payload.get("name"), "name", 80)
        description = require_text(payload.get("description"), "description", 300)
        parent_raw = payload.get("parentId")
        parent_id = None
        if parent_raw not in (None, ""):
            parent_id = require_text(parent_raw, "parentId", 64)
        topics = topic_map(manifest)
        if topic_id in topics:
            raise ApiError(409, "主题 ID 已存在")
        existing_names = {str(topic.get("name", "")).casefold() for topic in manifest["topics"]}
        if name.casefold() in existing_names:
            raise ApiError(409, "主题名称已存在")
        parent = None
        if parent_id:
            parent = topics.get(parent_id)
            if parent is None:
                raise ApiError(400, "父主题不存在")
            directory_name = f"{parent['directory']}/{topic_id}"
        else:
            directory_name = topic_id
        directory = ARTICLE_DIR / directory_name
        if directory.exists():
            raise ApiError(409, "主题目录已存在")
        sibling_orders = [
            int(topic.get("order", 0))
            for topic in manifest["topics"]
            if (topic.get("parentId") or None) == parent_id
        ]
        next_order = max(sibling_orders, default=0) + 1
        topic = {
            "id": topic_id,
            "name": name,
            "description": description,
            "directory": directory_name,
            "parentId": parent_id,
            "order": next_order,
            "articleCount": 0,
        }
        manifest["topics"].append(topic)
        refresh_manifest(manifest)
        manifest_snapshot = MANIFEST_PATH.read_bytes()
        data_snapshot = DATA_PATH.read_bytes() if DATA_PATH.is_file() else None

        try:
            directory.mkdir(parents=True, exist_ok=False)
            write_manifest(manifest)
            output = run_build()
        except Exception as exc:
            if directory.exists():
                try:
                    directory.rmdir()
                except OSError:
                    pass
            atomic_write(MANIFEST_PATH, manifest_snapshot.decode("utf-8"))
            if data_snapshot is not None:
                atomic_write(DATA_PATH, data_snapshot.decode("utf-8"))
            elif DATA_PATH.exists():
                DATA_PATH.unlink()
            if isinstance(exc, ApiError):
                raise
            raise ApiError(500, f"创建主题失败：{exc}")

        return {
            "ok": True,
            "topic": topic,
            "message": build_output_message(output),
        }


def preview_markdown(payload: dict) -> dict:
    body = require_body(payload.get("body"))
    slug = payload.get("slug")
    topic_id = payload.get("topicId")
    manifest = read_manifest()
    records = article_map(manifest)
    record = records.get(slug) if isinstance(slug, str) else None
    if record is not None:
        current_file = article_path(record)
    else:
        topics = topic_map(manifest)
        topic = topics.get(topic_id) if isinstance(topic_id, str) else None
        if topic is None:
            raise ApiError(400, "预览需要有效主题")
        safe_slug = slug if isinstance(slug, str) and SLUG_RE.fullmatch(slug) else "preview"
        current_file = (ARTICLE_DIR / topic["directory"] / f"{safe_slug}.md").resolve()

    by_file = {}
    for article in manifest["articles"]:
        by_file[article_path(article)] = article
    try:
        renderer = build.MarkdownRenderer(by_file, current_file)
        html = renderer.render(body)
    except build.BuildError as exc:
        raise ApiError(400, str(exc))
    return {"html": html}


def strip_base_path(path: str) -> str:
    if path == BASE_PATH:
        return "/"
    if path.startswith(BASE_PATH + "/"):
        return path[len(BASE_PATH):]
    return path


class EditorHandler(SimpleHTTPRequestHandler):
    server_version = "HappyDaysEditor/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def redirect_to_base(self) -> None:
        self.send_response(302)
        self.send_header("Location", BASE_PATH + "/")
        self.end_headers()

    def redirect_to_home(self) -> None:
        self.send_response(302)
        self.send_header("Location", "/home")
        self.end_headers()

    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        stripped = strip_base_path(unquote(parsed.path))
        if stripped == "/home":
            stripped = "/home/home.html"
        if stripped == "/photos":
            stripped = "/photos.html"
        if re.fullmatch(r"/bank/[a-z0-9-]+/?", stripped):
            stripped = "/bank.html"
        if parsed.query:
            stripped += "?" + parsed.query
        return super().translate_path(stripped)

    def log_message(self, format_string, *args):
        sys.stderr.write(
            f"[{self.log_date_time_string()}] {self.client_address[0]} "
            f"{format_string % args}\n"
        )

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError(400, "Content-Length 无效")
        if length <= 0:
            raise ApiError(400, "请求体不能为空")
        if length > MAX_REQUEST_BYTES:
            raise ApiError(413, "请求体过大")
        raw = self.rfile.read(length)
        if len(raw) != length:
            raise ApiError(400, "请求体不完整")
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ApiError(400, "请求体必须是合法 JSON")
        if not isinstance(payload, dict):
            raise ApiError(400, "请求体必须是 JSON 对象")
        return payload

    def do_GET(self) -> None:
        request_path = unquote(urlparse(self.path).path)
        if request_path in ("/", "/index.html", "/home.html", "/home/"):
            self.redirect_to_home()
            return
        if request_path in ("/bank", "/bank/"):
            self.redirect_to_home()
            return
        if request_path in ("/photos/", "/photos.html"):
            self.send_response(302)
            self.send_header("Location", "/photos")
            self.end_headers()
            return
        if request_path == "/favicon.ico":
            self.send_response(302)
            self.send_header("Location", "/icon.png?v=2")
            self.end_headers()
            return
        if request_path == BASE_PATH:
            self.redirect_to_base()
            return
        path = strip_base_path(request_path)
        try:
            with LOCK:
                if path == "/api/health":
                    self.send_json(200, {"ok": True, "backend": "python"})
                    return
                if path == "/api/state":
                    manifest = read_manifest()
                    self.send_json(200, public_state(manifest))
                    return
                if path == "/api/titles":
                    self.send_json(200, read_title_config())
                    return
                if path == "/api/home":
                    self.send_json(200, read_home_config())
                    return
                history_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)/history", path)
                if history_match:
                    record = require_history_record(history_match.group(1))
                    versions, earliest = article_history_versions(record)
                    self.send_json(200, {"versions": versions, "earliest": earliest})
                    return
                history_detail_match = re.fullmatch(
                    r"/api/articles/([a-z0-9-]+)/history/([0-9a-fA-F]{7,40})",
                    path,
                )
                if history_detail_match:
                    self.send_json(
                        200,
                        article_history_detail(
                            history_detail_match.group(1),
                            history_detail_match.group(2),
                        ),
                    )
                    return
                match = re.fullmatch(r"/api/articles/([a-z0-9-]+)", path)
                if match:
                    self.send_json(200, read_article(match.group(1)))
                    return
            super().do_GET()
        except ApiError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except Exception as exc:
            self.send_json(500, {"error": f"服务器错误：{exc}"})

    def do_PUT(self) -> None:
        path = strip_base_path(unquote(urlparse(self.path).path))
        match = re.fullmatch(r"/api/articles/([a-z0-9-]+)", path)
        try:
            payload = self.read_json()
            if path == "/api/titles":
                self.send_json(200, update_titles(payload))
                return
            if path == "/api/home":
                self.send_json(200, update_home_config(payload))
                return
            history_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)/history/earliest", path)
            if history_match:
                self.send_json(
                    200,
                    set_history_earliest(
                        history_match.group(1),
                        payload.get("hash"),
                        payload.get("author"),
                    ),
                )
                return
            if not match:
                raise ApiError(404, "接口不存在")
            result = update_article(match.group(1), payload)
            self.send_json(200, result)
        except ApiError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except Exception as exc:
            self.send_json(500, {"error": f"服务器错误：{exc}"})

    def do_POST(self) -> None:
        path = strip_base_path(unquote(urlparse(self.path).path))
        try:
            if path == "/api/photos/albums":
                payload = self.read_json()
                self.send_json(200, add_photos_album(payload))
                return
            photo_image_match = re.fullmatch(r"/api/photos/albums/([^/]+)/images", path)
            if photo_image_match:
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise ApiError(400, "Content-Length 无效")
                if length <= 0:
                    raise ApiError(400, "图片文件不能为空")
                if length > MAX_PHOTO_BYTES:
                    raise ApiError(413, "图片文件不能超过 25MB")
                image = self.rfile.read(length)
                if len(image) != length:
                    raise ApiError(400, "图片文件上传不完整")
                query = parse_qs(urlparse(self.path).query)
                filename = query.get("filename", [""])[0]
                self.send_json(
                    200,
                    upload_photos_image(photo_image_match.group(1), filename, image),
                )
                return
            icon_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)/icon", path)
            if icon_match:
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise ApiError(400, "Content-Length 无效")
                if length <= 0:
                    raise ApiError(400, "封面图片不能为空")
                if length > MAX_ICON_BYTES:
                    raise ApiError(413, "封面图片不能超过 10MB")
                image = self.rfile.read(length)
                if len(image) != length:
                    raise ApiError(400, "封面图片上传不完整")
                query = parse_qs(urlparse(self.path).query)
                filename = query.get("filename", [""])[0]
                self.send_json(200, upload_article_icon(icon_match.group(1), filename, image))
                return
            if path == "/api/home/images":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise ApiError(400, "Content-Length 无效")
                if length <= 0:
                    raise ApiError(400, "图片文件不能为空")
                if length > MAX_HOME_IMAGE_BYTES:
                    raise ApiError(413, "图片文件不能超过 20MB")
                image = self.rfile.read(length)
                if len(image) != length:
                    raise ApiError(400, "图片文件上传不完整")
                query = parse_qs(urlparse(self.path).query)
                weight_value = query.get("weight", ["1"])[0]
                try:
                    weight = float(weight_value)
                except (TypeError, ValueError):
                    weight = weight_value
                payload = {
                    "filename": query.get("filename", [""])[0],
                    "weight": weight,
                }
                self.send_json(200, add_home_image(payload, image))
                return
            if path == "/api/bgm":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise ApiError(400, "Content-Length 无效")
                if length <= 0:
                    raise ApiError(400, "音频文件不能为空")
                if length > MAX_BGM_BYTES:
                    raise ApiError(413, "音频文件不能超过 50MB")
                audio = self.rfile.read(length)
                if len(audio) != length:
                    raise ApiError(400, "音频文件上传不完整")
                query = parse_qs(urlparse(self.path).query)
                weight_value = query.get("weight", ["1"])[0]
                try:
                    weight = float(weight_value)
                except (TypeError, ValueError):
                    weight = weight_value
                payload = {
                    "title": query.get("title", [""])[0],
                    "filename": query.get("filename", [""])[0],
                    "weight": weight,
                }
                self.send_json(200, add_bgm_track(payload, audio))
                return
            comment_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)/comments", path)
            if comment_match:
                payload = self.read_json()
                self.send_json(200, add_article_comment(comment_match.group(1), payload))
                return
            move_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)/move", path)
            if move_match:
                payload = self.read_json()
                self.send_json(200, move_article_order(move_match.group(1), payload))
                return
            if path == "/api/articles":
                payload = self.read_json()
                self.send_json(200, create_article(payload))
                return
            if path == "/api/topics":
                payload = self.read_json()
                self.send_json(200, create_topic(payload))
                return
            if path == "/api/preview":
                payload = self.read_json()
                self.send_json(200, preview_markdown(payload))
                return
            raise ApiError(404, "接口不存在")
        except ApiError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except Exception as exc:
            self.send_json(500, {"error": f"服务器错误：{exc}"})

    def do_DELETE(self) -> None:
        path = strip_base_path(unquote(urlparse(self.path).path))
        try:
            if path.startswith("/api/bgm/"):
                filename = path[len("/api/bgm/"):]
                self.send_json(200, delete_bgm_track(filename))
                return
            if path.startswith("/api/home/images/"):
                filename = path[len("/api/home/images/"):]
                self.send_json(200, delete_home_image(filename))
                return
            photo_image_match = re.fullmatch(r"/api/photos/albums/([^/]+)/images/([^/]+)", path)
            if photo_image_match:
                self.send_json(
                    200,
                    delete_photos_image(photo_image_match.group(1), photo_image_match.group(2)),
                )
                return
            article_match = re.fullmatch(r"/api/articles/([a-z0-9-]+)", path)
            if article_match:
                self.send_json(200, delete_article(article_match.group(1)))
                return
            topic_match = re.fullmatch(r"/api/topics/([a-z0-9-]+)", path)
            if topic_match:
                self.send_json(200, delete_topic(topic_match.group(1)))
                return
            raise ApiError(404, "接口不存在")
        except ApiError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except Exception as exc:
            self.send_json(500, {"error": f"服务器错误：{exc}"})


class EditorServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the local HappyDays Wiki editor.")
    parser.add_argument("--host", default="127.0.0.1", help="bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="bind port (default: 8000)")
    args = parser.parse_args()
    if args.host not in ("127.0.0.1", "localhost"):
        print("警告：编辑器没有认证，建议只绑定 127.0.0.1。", file=sys.stderr)

    if os.environ.get("SKIP_STARTUP_BUILD", "").lower() in ("1", "true", "yes"):
        print("已跳过启动前构建（SKIP_STARTUP_BUILD=1）", flush=True)
    else:
        try:
            build_message = build_output_message(run_build())
            print(f"启动前自动构建：{build_message}", flush=True)
        except ApiError as exc:
            print(f"启动前构建失败：{exc.message}", file=sys.stderr, flush=True)
            return 1

    try:
        httpd = EditorServer((args.host, args.port), EditorHandler)
    except OSError as exc:
        print(f"无法启动服务：{exc}", file=sys.stderr, flush=True)
        return 1
    print(f"HappyDays Wiki 首页：http://{args.host}:{args.port}/home", flush=True)
    print(f"HappyDays Wiki 编辑器已启动：http://{args.host}:{args.port}/wiki/editor.html", flush=True)
    print(f"阅读站点：http://{args.host}:{args.port}/wiki/", flush=True)
    print("按 Ctrl+C 停止。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止…")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
slack_notify.py — Slack Incoming Webhook 通知ヘルパー

SSM Parameter Store から Webhook URL を取得し、Slack に通知を送る。
通知失敗がインフラ操作をブロックしないよう fire-and-forget で動作する。

- Webhook URL 未設定時はグレースフルにスキップ
- ネットワークエラー等はログ出力のみ（例外を raise しない）

使用方法:
  from slack_notify import notify_start_error, notify_stop_success, notify_stop_error, notify_stack_event
"""

import json
import os
import urllib.request
import urllib.error

import boto3

_PROJECT_NAME = os.environ.get("PROJECT_NAME", "next-project")
_ssm = boto3.client("ssm")

# cold start 時にキャッシュ（Lambda 再利用時は SSM 呼び出しを省略）
_webhook_url: str | None = None
_webhook_url_loaded = False


def _get_webhook_url() -> str | None:
    """SSM から SLACK_WEBHOOK_URL を取得する。未設定なら None を返す。"""
    global _webhook_url, _webhook_url_loaded
    if _webhook_url_loaded:
        return _webhook_url
    try:
        param = _ssm.get_parameter(
            Name=f"/{_PROJECT_NAME}/SLACK_WEBHOOK_URL",
            WithDecryption=True,
        )
        _webhook_url = param["Parameter"]["Value"]
    except _ssm.exceptions.ParameterNotFound:
        print("[slack] SLACK_WEBHOOK_URL not configured in SSM — skipping notifications")
        _webhook_url = None
    except Exception as e:
        print(f"[slack] Failed to get SLACK_WEBHOOK_URL from SSM: {e}")
        _webhook_url = None
    _webhook_url_loaded = True
    return _webhook_url


def _post_to_slack(payload: dict) -> None:
    """Slack Webhook に JSON を POST する。失敗しても例外を raise しない。"""
    url = _get_webhook_url()
    if not url:
        return
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                print(f"[slack] Unexpected status: {resp.status}")
    except urllib.error.URLError as e:
        print(f"[slack] Failed to send notification: {e}")
    except Exception as e:
        print(f"[slack] Unexpected error: {e}")


def send_slack(text: str) -> None:
    """シンプルテキストメッセージを Slack に送る。"""
    _post_to_slack({"text": text})


# ---- 高レベル通知関数 ----

def notify_start_error(error: Exception) -> None:
    """start Lambda の早期エラー（RDS 復元失敗等）を通知する。"""
    send_slack(f"❌ *Environment start FAILED*\n```{error}```")


def notify_stop_success(source: str) -> None:
    """停止成功を通知する。source は "manual" or "auto-stop"。"""
    label = "🔄 Auto-stop" if source == "auto-stop" else "🛑 Manual stop"
    send_slack(f"✅ *Environment is DOWN* ({label})")


def notify_stop_error(error: Exception, source: str) -> None:
    """停止失敗を通知する。"""
    label = "auto-stop" if source == "auto-stop" else "manual stop"
    send_slack(f"❌ *Environment stop FAILED* ({label})\n```{error}```")


def notify_stack_event(stack_name: str, status: str) -> None:
    """CloudFormation スタックのステータス変更を通知する。"""
    if status in ("CREATE_COMPLETE", "UPDATE_COMPLETE"):
        send_slack(
            f"✅ *Environment is UP!*\n"
            f"   admin : https://admin.studify.click\n"
            f"   user  : https://app.studify.click\n"
            f"   _(stack: {stack_name} → {status})_"
        )
    elif status == "DELETE_COMPLETE":
        send_slack(f"🗑️ Edge Stack deleted _(stack: {stack_name} → {status})_")
    elif "FAILED" in status or "ROLLBACK" in status:
        send_slack(
            f"❌ *Edge Stack operation FAILED*\n"
            f"   stack: {stack_name}\n"
            f"   status: {status}\n"
            f"   Check CloudFormation console for details."
        )
    else:
        print(f"[slack] Ignoring stack event: {stack_name} → {status}")

"""
Notification Delivery Lambda
-----------------------------
EventBridge Scheduler から起動し、指定された AdminNotification を配信する。

Event payload:
  { "notificationId": "<cuid>" }

Required environment variables:
  DATABASE_URL          - PostgreSQL 接続文字列
  USER_APP_URL          - Studify Click のベース URL（ALB 経由）
  INTERNAL_API_SECRET   - /api/internal/broadcast 認証トークン
"""

import json
import os
import urllib.request
import uuid
from datetime import datetime, timezone

import boto3
import psycopg2
import psycopg2.extras

_ssm = boto3.client("ssm")
_project = os.environ.get("PROJECT_NAME", "next-project")
_DATABASE_URL = _ssm.get_parameter(Name=f"/{_project}/DATABASE_URL", WithDecryption=True)["Parameter"]["Value"]
_INTERNAL_API_SECRET = _ssm.get_parameter(Name=f"/{_project}/INTERNAL_API_SECRET", WithDecryption=True)["Parameter"]["Value"]
_USER_APP_URL = os.environ.get("USER_APP_URL", "http://localhost:3001")


def handler(event, context):
    notification_id = event.get("notificationId")
    if not notification_id:
        raise ValueError("notificationId is required in event payload")

    conn = psycopg2.connect(_DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        user_ids, notification_snapshot = _deliver(conn, notification_id)
    finally:
        conn.close()

    if notification_snapshot is not None and user_ids:
        _broadcast(_USER_APP_URL, _INTERNAL_API_SECRET, user_ids, notification_snapshot)

    return {"ok": True, "delivered": len(user_ids) if user_ids else 0}


def _deliver(conn, notification_id: str):
    """
    トランザクション内で配信処理を実行する。
    - deliveredAt が既にセットされていれば何もしない（冪等性保証）。
    - 対象ユーザーの notifications レコードを INSERT し、deliveredAt を更新する。
    戻り値: (user_ids, notification_snapshot) or ([], None)
    """
    now = datetime.now(timezone.utc)

    with conn:
        with conn.cursor() as cur:
            # SELECT FOR UPDATE で行ロックを取得し二重配信を防ぐ
            cur.execute(
                """
                SELECT id, title, body, type, "targetType", "deliveredAt"
                FROM admin_notifications
                WHERE id = %s
                FOR UPDATE
                """,
                (notification_id,),
            )
            row = cur.fetchone()

            if not row:
                print(f"[deliver] AdminNotification not found: {notification_id}")
                return [], None

            if row["deliveredAt"] is not None:
                print(f"[deliver] Already delivered: {notification_id}")
                return [], None

            # ターゲットユーザーを解決し通知を挿入
            if row["targetType"] == "ALL":
                # 全ユーザーを対象に Python 側で UUID を生成して一括 INSERT する
                cur.execute("SELECT id FROM users")
                user_ids = [r["id"] for r in cur.fetchall()]

                if user_ids:
                    values = [
                        (
                            str(uuid.uuid4()),
                            uid,
                            notification_id,
                            row["title"],
                            row["body"],
                            row["type"],
                            False,
                            now,
                            now,
                        )
                        for uid in user_ids
                    ]
                    psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO notifications
                          (id, "userId", "adminNotificationId", title, body, type, "isRead", "createdAt", "updatedAt")
                        VALUES %s
                        ON CONFLICT DO NOTHING
                        """,
                        values,
                    )
            else:
                cur.execute(
                    'SELECT "userId" FROM admin_notification_targets WHERE "adminNotificationId" = %s',
                    (notification_id,),
                )
                user_ids = [r["userId"] for r in cur.fetchall()]

                if user_ids:
                    # ユーザー受信箱へ一括 INSERT（CUID の代わりに UUID を使用）
                    values = [
                        (
                            str(uuid.uuid4()),
                            uid,
                            notification_id,
                            row["title"],
                            row["body"],
                            row["type"],
                            False,
                            now,
                            now,
                        )
                        for uid in user_ids
                    ]
                    psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO notifications
                          (id, "userId", "adminNotificationId", title, body, type, "isRead", "createdAt", "updatedAt")
                        VALUES %s
                        ON CONFLICT DO NOTHING
                        """,
                        values,
                    )

            # deliveredAt をマーク（二重実行時は既に FOR UPDATE で保護済み）
            cur.execute(
                'UPDATE admin_notifications SET "deliveredAt" = %s, "updatedAt" = %s WHERE id = %s',
                (now, now, notification_id),
            )

            print(f"[deliver] Delivered {notification_id} to {len(user_ids)} users")

            notification_snapshot = {
                "id": row["id"],
                "title": row["title"],
                "body": row["body"],
                "type": row["type"],
            }
            return user_ids, notification_snapshot


def _broadcast(user_app_url: str, secret: str, user_ids: list, notification: dict):
    """
    Studify Click の /api/internal/broadcast に WebSocket + Push 通知を依頼する。
    失敗しても配信成功扱い（fire-and-forget）。
    """
    payload = json.dumps({"userIds": user_ids, "notification": notification}).encode("utf-8")
    req = urllib.request.Request(
        f"{user_app_url}/api/internal/broadcast",
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[broadcast] OK: {resp.status}")
    except Exception as exc:
        print(f"[broadcast] Failed (ignored): {exc}")

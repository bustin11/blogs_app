use crate::app_data::{AppData, MyError};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn set_blog_version(
  app_data: web::Data<AppData>,
  path: web::Path<(Uuid, i64)>,
) -> Result<HttpResponse, MyError> {
  let (blog_id, version) = path.into_inner();
    let client = app_data.db_pool.get().await.unwrap();
    let sql_string =
      r#"
        UPDATE blogs SET 
          message = sq.message,
          heading = sq.heading,
          title = sq.title,
          chapter = sq.chapter::BIGINT,
          question = sq.question,
          updated_on = sq.timestamp,
          active_version = $1
        FROM (
          SELECT 
          operation #>> '{0, "message"}' AS message,
          operation #>> '{0, "heading"}' AS heading,
          operation #>> '{0, "title"}' AS title,
          operation #>> '{0, "chapter"}' AS chapter,
          operation #> '{0, "question"}' AS question,
          timestamp
          FROM blogs_history
          WHERE version = $1 AND blog_id = $2
        ) AS sq
        WHERE id = $2 AND active_version <> $1
      "#;

    let _ = client
        .execute(sql_string, &[&version, &blog_id])
        .await
        .unwrap();

    Ok(HttpResponse::Ok().finish())
}

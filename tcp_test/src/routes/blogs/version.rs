use crate::{
  app_data::{AppData, MyError},
  blogs::blog_model::{BlogVersionResponse, Post},
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn get_blog_version(
  app_data: web::Data<AppData>,
  path: web::Path<(Uuid, i64)>,
) -> Result<HttpResponse, MyError> {
  let (blog_id, version) = path.into_inner();
    let client = app_data.db_pool.get().await.unwrap();
    let sql_string =
      r#"SELECT 
        operation #>> '{0, "message"}' AS message,
        operation #>> '{0, "heading"}' AS heading,
        operation #>> '{0, "title"}' AS title,
        (operation #>> '{0, "chapter"}')::BIGINT AS chapter,
        operation #> '{0, "question"}' AS question,
        (operation #>> '{0, "created_on"}')::TIMESTAMPTZ AS created_on,
        timestamp
        FROM 
        blogs_history
      WHERE blog_id = $1 AND version = $2
      "#;

    let row = client
        .query_one(sql_string, &[&blog_id, &version])
        .await
        .unwrap();

    let questions: serde_json::Value = row.try_get("question").unwrap();
    let post = Post {
        heading: row.try_get("heading").unwrap(),
        date: row.try_get("created_on").unwrap(),
        updated_on: row.try_get("timestamp").unwrap(),
        message: row.try_get("message").unwrap(),
        post_id: blog_id,
        title: row.try_get("title").unwrap(),
        chapter: row.try_get("chapter").unwrap(),
        questions: serde_json::from_value(questions).unwrap(),
        active_version: version,
        num_versions: -1, // DOESN'T MATTER
        tags: vec![] // DOESN't MATTER
    };


    let response = BlogVersionResponse {
        post,
    };
    Ok(HttpResponse::Ok().json(response))
}

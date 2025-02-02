use crate::{
  app_data::{AppData, MyError}, blogs::tag_model::Tag, middleware::SessionData
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn list_tags(
  app_data: web::Data<AppData>,
  session_data: SessionData,
) -> Result<HttpResponse, MyError> {
  let sql_string = "
    SELECT id, name FROM tags WHERE user_id = $1
";
  let client = app_data.db_pool.get().await?;
  let rows = client
      .query(
          sql_string,
          &[&session_data.user_id],
      )
      .await?;
  let mut tags = vec![];
  for row in rows {
    let id: Uuid = row.try_get("id").unwrap();
    let name: String = row.try_get("name").unwrap();
    let tag = Tag {
      id,
      name
    };
    tags.push(tag);
  }
  let response = serde_json::json!({
    "tags": tags
  });
  println!("list tags response: {response:?}");
  Ok(HttpResponse::Ok().json(response))
}

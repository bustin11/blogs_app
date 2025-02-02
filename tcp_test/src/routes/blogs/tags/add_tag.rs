use crate::app_data::{AppData, MyError};
use actix_web::{web, HttpResponse};

pub async fn add_tag_to_blog(
  app_data: web::Data<AppData>,
  path: web::Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<HttpResponse, MyError> {
  let sql_string = "
  INSERT INTO blog_tags 
  (tag_id, blog_id) VALUES ($1, $2)
  ON CONFLICT (blog_id, tag_id) DO NOTHING
";
  let client = app_data.db_pool.get().await?;
  let (blog_id, tag_id) = path.into_inner();
  let res = client
      .execute(
          sql_string,
          &[&tag_id, &blog_id],
      )
      .await?;
  if res == 0 {
      Ok(HttpResponse::Ok().finish())
  } else {
      Ok(HttpResponse::Created().into())
  }
}

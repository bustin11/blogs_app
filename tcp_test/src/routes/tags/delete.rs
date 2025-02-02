use crate::{
  app_data::{AppData, MyError},
  middleware::SessionData,
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn delete_tag(
  app_data: web::Data<AppData>,
  path: web::Path<Uuid>,
  session_data: SessionData,
) -> Result<HttpResponse, MyError> {
  let sql_string = "
    DELETE FROM tags WHERE id = $1 and user_id = $2
  ";
  let tag_id = path.into_inner(); 
  println!("deleting tag .... {tag_id}");
  let client = app_data.db_pool.get().await?;
  let _ = client
      .execute(
          sql_string,
          &[&tag_id, &session_data.user_id],
      )
      .await?;
  Ok(HttpResponse::Ok().finish())
}

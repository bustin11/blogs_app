use crate::app_data::{AppData, MyError};
use actix_web::{web, HttpResponse};

pub async fn remove_tag_from_blog(
    app_data: web::Data<AppData>,
    path: web::Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<HttpResponse, MyError> {
    let sql_string = "
  DELETE FROM blog_tags 
  WHERE tag_id = $1 and blog_id = $2
";
    let client = app_data.db_pool.get().await?;
    let (blog_id, tag_id) = path.into_inner();
    let res = client.execute(sql_string, &[&tag_id, &blog_id]).await?;
    if res == 0 {
        Ok(HttpResponse::Ok().finish())
    } else {
        Ok(HttpResponse::Created().into())
    }
}

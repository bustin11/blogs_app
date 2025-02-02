use crate::{
  app_data::{AppData, MyError},
  blogs::list_versions_model::{ListVersionSingle, ListVersionsResponse},
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn list_blog_versions(
  app_data: web::Data<AppData>,
  path: web::Path<Uuid>,
) -> Result<HttpResponse, MyError> {
  let blog_id = path.into_inner();
    let client = app_data.db_pool.get().await.unwrap();
    let sql_string =
      r#"SELECT 
        timestamp, version
        FROM 
        blogs_history
      WHERE blog_id = $1 ORDER BY version
      "#;

    let rows = client
        .query(sql_string, &[&blog_id])
        .await
        .unwrap();

    let mut versions = vec![];
    for row in rows {
      let single = ListVersionSingle {
        updated_on: row.try_get("timestamp").unwrap(),
        version_id: row.try_get("version").unwrap(),
      };
      versions.push(single);
    }


    let response = ListVersionsResponse {
        version_previews: versions
    };
    Ok(HttpResponse::Ok().json(response))
}

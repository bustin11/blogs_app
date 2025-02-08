use crate::{
    app_data::{AppData, MyError},
    blogs::{
        blog_model::{BlogQueryParams, BlogResponse, Post},
        filters::{parse_string, parser::Filters},
        tag_model::Tag,
    },
    middleware::SessionData,
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

fn get_search_string(regex_pattern: &str) -> Result<String, MyError> {
    let filters: Option<Filters> = parse_string(regex_pattern.to_string())?;
    println!("filters are {filters:?}");
    let search_string = if let Some(ref filter) = filters {
        format!("AND {}", filter.to_sql_string()?)
    } else {
        "AND TRUE".to_string()
    };
    Ok(search_string)
}

pub async fn get_blogs(
    app_data: web::Data<AppData>,
    params: actix_web::web::Query<BlogQueryParams>,
    session_data: SessionData,
) -> Result<HttpResponse, MyError> {
    if params.page_size < 0 || params.offset <= 0 {
        Err(MyError::new(
            "Page size or offset size cannot be empty",
            400,
        ))
    } else {
        let search_string = if let Some(pat) = params.regex_pattern.as_ref() {
            match get_search_string(pat) {
                Ok(x) => x,
                Err(_x) => {
                    if !pat.is_empty() {
                        format!("AND message ~* '{pat}' OR heading ~* '{pat}' OR title ~* '{pat}' OR chapter::text ~* '{pat}' OR t.name ~* '{pat}'")
                    } else {
                        "AND TRUE".into()
                    }
                }
            }
        } else {
            "AND TRUE".into()
        };
        println!("search_string is {search_string}");
        let client = app_data.db_pool.get().await.unwrap();
        let sql_string = format!(
          "SELECT 
            message, b.created_on, 
            updated_on, COUNT(*) OVER() as num_blogs,
            heading, b.id, title, chapter, question, 
            COALESCE(ARRAY_AGG(bt.tag_id ORDER BY t.created_on) FILTER (WHERE bt.tag_id IS NOT NULL), '{{}}'::UUID[]) as tag_ids, 
            COALESCE(ARRAY_AGG(t.name ORDER BY t.created_on) FILTER (WHERE t.name IS NOT NULL), '{{}}'::TEXT[]) as tag_names,
            active_version,
            num_versions
           FROM 
            blogs b LEFT JOIN blog_tags bt 
            ON b.id = bt.blog_id 
            LEFT JOIN tags t 
            ON t.id = bt.tag_id
          WHERE b.user_id = $1
          {search_string}
          GROUP BY b.id
          ORDER BY created_on {sort_order}
          OFFSET {offset} 
          LIMIT {limit}
          ",
          offset = (params.offset - 1) * params.page_size,
          limit = params.page_size,
          sort_order = params.sort_order
      );
        println!("sort order is {}", params.sort_order);
        // println!("sql string is {sql_string}");
        let rows = client
            .query(&sql_string, &[&session_data.user_id])
            .await
            .unwrap();
        let mut num_blogs: i64 = 0;
        let mut posts = vec![];
        for row in rows {
            num_blogs = row.try_get("num_blogs").unwrap();
            let tag_names: Vec<String> = row.try_get("tag_names").unwrap();
            let tag_ids: Vec<Uuid> = row.try_get("tag_ids").unwrap();
            let tags = tag_names
                .into_iter()
                .zip(tag_ids)
                .map(|(name, id)| Tag { id, name });
            let questions: serde_json::Value = row.try_get("question").unwrap();
            posts.push(Post {
                heading: row.try_get("heading").unwrap(),
                date: row.try_get("created_on").unwrap(),
                updated_on: row.try_get("updated_on").unwrap(),
                message: row.try_get("message").unwrap(),
                post_id: row.try_get("id").unwrap(),
                title: row.try_get("title").unwrap(),
                chapter: row.try_get("chapter").unwrap(),
                questions: serde_json::from_value(questions).unwrap(),
                active_version: row.try_get("active_version").unwrap(),
                num_versions: row.try_get("num_versions").unwrap(),
                tags: tags.collect(),
            });
        }

        let response = BlogResponse {
            size: num_blogs as usize,
            posts,
        };
        Ok(HttpResponse::Ok().json(response))
    }
}

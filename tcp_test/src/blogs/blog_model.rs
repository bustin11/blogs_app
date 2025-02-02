
use derive_more::derive::Debug;

use super::tag_model::Tag;


#[derive(serde::Deserialize, Debug, strum::Display, strum::EnumString)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    Asc,
    Desc,
}

#[derive(serde::Deserialize, Debug)]
pub struct BlogQueryParams {
    #[serde(default)]
    pub id: String, // be uniqueA
    #[serde(default = "_default_page_size_")]
    pub page_size: i64,
    #[serde(default = "_default_offset_")]
    pub offset: i64,
    #[serde(default = "_default_order_by_")]
    pub sort_order: SortOrder,
    // pub regex_pattern: Option<String>,
    // pub exact_match: bool,
    // #[serde(deserialize_with="parse_tokens")]
    pub regex_pattern: Option<String>,
    /*
       heading: John AND message: fjdsalfkdjsa
    */
    // test_enum: TestEnum,
}

fn _default_page_size_() -> i64 {
    7
}

fn _default_offset_() -> i64 {
    1
}

fn _default_order_by_() -> SortOrder {
    SortOrder::Desc
}


#[derive(serde::Deserialize, serde::Serialize)]
#[serde(untagged)]
pub enum TestEnum {
    Integer(i64),
    String(String),
}

#[derive(serde::Serialize, Debug)]
pub struct BlogResponse {
    pub posts: Vec<Post>,
    pub size: usize,
}

#[derive(serde::Serialize, Debug)]
pub struct BlogVersionResponse {
    pub post: Post,
}

#[derive(serde::Serialize, Debug)]
pub struct Post {
    pub heading: String,
    pub date: chrono::DateTime<chrono::Utc>,
    pub updated_on: chrono::DateTime<chrono::Utc>,
    pub message: String,
    pub post_id: uuid::Uuid,
    pub title: String,
    pub chapter: i64,
    pub questions: Vec<String>,
    pub tags: Vec<Tag>,
    pub active_version: i64,
    pub num_versions: i64
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct BlogJsonParams {
    pub heading: String,
    pub message: String,
    pub title: String,
    pub chapter: i64,
    #[serde(default = "default_question")]
    pub questions: Vec<String>,
}

fn default_question() -> Vec<String> {
    vec![]
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

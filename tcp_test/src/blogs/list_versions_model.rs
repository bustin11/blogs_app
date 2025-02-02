
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ListVersionSingle {
    pub version_id: i64,
    pub updated_on: chrono::DateTime<chrono::Utc>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ListVersionsResponse {
    pub version_previews: Vec<ListVersionSingle>,
}
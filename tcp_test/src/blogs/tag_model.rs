use uuid::Uuid;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct TagParams {
    pub tag_name: String,
}

#[derive(serde::Serialize, Debug)]
pub struct BlogTagParams {
    pub tag_id: Uuid,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct Tag {
    pub id: Uuid,
    pub name: String,
}
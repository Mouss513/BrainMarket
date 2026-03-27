alter table user_preferences
  add column if not exists reference_sectors text[] default '{"Streetwear"}';

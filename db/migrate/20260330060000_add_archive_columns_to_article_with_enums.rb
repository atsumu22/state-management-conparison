class AddArchiveColumnsToArticleWithEnums < ActiveRecord::Migration[8.1]
  def change
    add_column :article_with_enums, :archived_at, :datetime
    add_column :article_with_enums, :archiver_id, :bigint
  end
end

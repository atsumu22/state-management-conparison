class CreateArticleArchives < ActiveRecord::Migration[8.1]
  def change
    create_table :article_archives do |t|
      t.bigint :article_with_relation_id, null: false
      t.bigint :archiver_id, null: false
      t.string :reason

      t.timestamps
    end

    add_index :article_archives, :article_with_relation_id, unique: true
    add_foreign_key :article_archives, :article_with_relations
  end
end

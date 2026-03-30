class CreateArticlePublications < ActiveRecord::Migration[8.1]
  def change
    create_table :article_publications do |t|
      t.bigint :article_with_relation_id, null: false
      t.bigint :publisher_id, null: false
      t.timestamps
    end

    add_index :article_publications, :article_with_relation_id, unique: true
    add_foreign_key :article_publications, :article_with_relations
  end
end

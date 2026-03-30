class CreateArticleWithRelations < ActiveRecord::Migration[8.1]
  def change
    create_table :article_with_relations do |t|
      t.string :title, null: false
      t.timestamps
    end
  end
end

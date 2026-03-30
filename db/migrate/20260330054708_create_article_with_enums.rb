class CreateArticleWithEnums < ActiveRecord::Migration[8.1]
  def change
    create_table :article_with_enums do |t|
      t.string :title, null: false
      t.integer :status, default: 0, null: false
      t.datetime :published_at
      t.bigint :publisher_id
      t.timestamps
    end
  end
end

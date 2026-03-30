# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_30_060001) do
  create_table "article_archives", force: :cascade do |t|
    t.bigint "archiver_id", null: false
    t.bigint "article_with_relation_id", null: false
    t.datetime "created_at", null: false
    t.string "reason"
    t.datetime "updated_at", null: false
    t.index ["article_with_relation_id"], name: "index_article_archives_on_article_with_relation_id", unique: true
  end

  create_table "article_publications", force: :cascade do |t|
    t.bigint "article_with_relation_id", null: false
    t.datetime "created_at", null: false
    t.bigint "publisher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["article_with_relation_id"], name: "index_article_publications_on_article_with_relation_id", unique: true
  end

  create_table "article_with_enums", force: :cascade do |t|
    t.datetime "archived_at"
    t.bigint "archiver_id"
    t.datetime "created_at", null: false
    t.datetime "published_at"
    t.bigint "publisher_id"
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
  end

  create_table "article_with_relations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "article_archives", "article_with_relations"
  add_foreign_key "article_publications", "article_with_relations"
end

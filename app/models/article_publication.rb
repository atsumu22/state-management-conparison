class ArticlePublication < ApplicationRecord
  belongs_to :article_with_relation, touch: true
end

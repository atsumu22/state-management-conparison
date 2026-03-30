class ArticleWithRelation < ApplicationRecord
  has_one :article_publication, dependent: :destroy

  validates :title, presence: true

  scope :published, -> { joins(:article_publication) }

  def publish!(user)
    create_article_publication!(publisher_id: user.id)
  end

  def published?
    article_publication.present?
  end
end

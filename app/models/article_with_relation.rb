class ArticleWithRelation < ApplicationRecord
  has_one :article_publication, dependent: :destroy
  has_one :article_archive, dependent: :destroy

  validates :title, presence: true

  scope :published, -> { joins(:article_publication) }
  scope :archived, -> { joins(:article_archive) }

  def publish!(user)
    create_article_publication!(publisher_id: user.id)
  end

  def published?
    article_publication.present?
  end

  def archive!(user, reason: nil)
    transaction do
      article_publication&.destroy!
      create_article_archive!(archiver_id: user.id, reason: reason)
    end
  end

  def archived?
    article_archive.present?
  end
end

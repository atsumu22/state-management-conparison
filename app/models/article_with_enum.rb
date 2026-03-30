class ArticleWithEnum < ApplicationRecord
  enum :status, { draft: 0, published: 1, archived: 2 }

  validates :title, presence: true

  def publish!(user)
    update!(
      status: :published,
      published_at: Time.current,
      publisher_id: user.id
    )
  end
end

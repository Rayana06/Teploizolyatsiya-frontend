import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadFirstFeedMaterial, loadNextFeedMaterial, toggleFeedLike } from '../store/materialsSlice'
import { formatPrice } from '../utils/formatters'

export function FeedPage() {
  const dispatch = useAppDispatch()
  const material = useAppSelector((state) => state.materials.feed)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => { if (!material) void dispatch(loadFirstFeedMaterial()) }, [dispatch, material])
  if (!material) return <main className="feed-page" />
  const imageSource = material.feedImageUrl ?? material.imageUrl ?? '/default-media/default-insulation.jpg'

  return (
    <main className="feed-page">
      <section className="feed-stage">
        <img className="feed-stage__image" src={imageSource} alt={`Материал «${material.name}»`} />
        <div className="feed-stage__shade" />
        <div className="feed-stage__copy">
          <span className="material-kind">{material.insulationType}</span>
          <h1>{material.name}</h1>
          <details className="feed-description" key={material.id}>
            <summary>
              <span className="feed-description__brief"><i className="bi bi-caret-right-fill" /> {material.shortDescription}</span>
              <span className="feed-description__toggle">Подробнее</span>
            </summary>
            <div className="feed-description__content">
              <p><strong>Тип утеплителя:</strong> {material.insulationType}</p>
              <p><strong>Толщина:</strong> {material.thicknessMm} мм</p>
              <p>{material.shortDescription}</p>
            </div>
          </details>
          <div className="feed-stage__meta">{material.thicknessMm} мм · {material.priceRubM2 > 0 ? `${formatPrice(material.priceRubM2)} / м²` : 'цена не указана'} · {material.source === 'mock' ? 'mock' : 'web-service'}</div>
        </div>
        <aside className="feed-stage__tools">
          <button type="button" className="feed-like feed-tool-button" disabled={!user || material.source === 'mock'} onClick={() => void dispatch(toggleFeedLike())} title={user ? 'Лайк' : 'Войдите для лайка'}>
            <i className={`bi ${material.liked ? 'bi-heart-fill' : 'bi-heart'}`} /><span>{material.likeCount}</span>
          </button>
          <button type="button" className="feed-next" onClick={() => void dispatch(loadNextFeedMaterial())} aria-label="Следующая услуга">
            <strong><i className="bi bi-arrow-right" /></strong><span>Следующая</span>
          </button>
        </aside>
      </section>
    </main>
  )
}

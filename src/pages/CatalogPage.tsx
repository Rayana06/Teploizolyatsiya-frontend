import { useEffect } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { CatalogFilters } from '../components/CatalogFilters'
import { MaterialCard } from '../components/MaterialCard'
import { materialsMock } from '../data/materials'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { applyFilters, setDraftFilter } from '../store/filtersSlice'
import { loadCatalog, removeMaterial } from '../store/materialsSlice'

const MIN_PRICE = Math.min(...materialsMock.map((material) => material.priceRubM2))
const MAX_PRICE = Math.max(...materialsMock.map((material) => material.priceRubM2))

export function CatalogPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.filters.draft)
  const { catalog, source, error } = useAppSelector((state) => state.materials)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => { void dispatch(loadCatalog()) }, [dispatch])
  useEffect(() => {
    document.title = `Плитка (${catalog.length}) — Теплощит`
    return () => { document.title = 'Теплощит — теплоизоляционные материалы' }
  }, [catalog.length])

  const submitFilters = () => {
    dispatch(applyFilters())
    void dispatch(loadCatalog())
  }

  return (
    <main className="catalog-page">
      <Container className="content-shell page-section">
        <h1>Каталог материалов</h1>
        <CatalogFilters
          price={filters.maxPriceRubM2}
          minPrice={MIN_PRICE}
          maxPrice={MAX_PRICE}
          onPriceChange={(value) => dispatch(setDraftFilter({ key: 'maxPriceRubM2', value }))}
          onApply={submitFilters}
        />
        <div className="catalog-meta">
          <span>Найдено: {catalog.length}</span>
          <small>{source === 'mock' ? (import.meta.env.VITE_DEPLOY_TARGET === 'pages' ? 'mock · офлайн' : 'mock · backend недоступен') : 'web-service · AJAX'}</small>
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {catalog.length > 0 ? (
          <Row className="g-4">
            {catalog.map((material) => (
              <Col md={6} xl={4} key={material.id}>
                <MaterialCard material={material} variant="tile" canDelete={Boolean(user && material.isCreator)} onDelete={() => void dispatch(removeMaterial(material.id))} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state"><i className="bi bi-search" /><h3>Материалы не найдены</h3><p>Измените фильтры.</p></div>
        )}
      </Container>
    </main>
  )
}

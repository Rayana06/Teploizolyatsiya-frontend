import { Badge, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { InsulationMaterial } from '../types/material'
import { MaterialFacts } from './MaterialFacts'
import { MaterialMedia } from './MaterialMedia'

interface MaterialCardProps {
  material: InsulationMaterial
  variant: 'feed' | 'tile'
  canDelete?: boolean
  onDelete?: () => void
}

export function MaterialCard({ material, variant, canDelete = false, onDelete }: MaterialCardProps) {
  const isFeed = variant === 'feed'

  return (
    <Card className={`material-card material-card--${variant}`}>
      <MaterialMedia
        imageUrl={material.imageUrl}
        videoUrl={material.videoUrl}
        name={material.name}
        showVideo={isFeed}
        compact={!isFeed}
      />
      <Card.Body>
        <div className="card-kicker">
          <Badge bg="light" text="dark">{material.insulationType}</Badge>
          <span>{material.source === 'mock' ? 'mock' : 'API'}</span>
        </div>
        <Card.Title>{material.name}</Card.Title>
        <div className="brand-name">{material.brand}</div>
        <Card.Text>{material.shortDescription}</Card.Text>
        <MaterialFacts material={material} compact={!isFeed} />
        <div className="card-actions">
          <Link to={`/materials/${material.id}`} className="btn btn-dark">Подробнее</Link>
          {canDelete && <button type="button" className="delete-card" onClick={onDelete} title="Логически удалить"><i className="bi bi-trash" /></button>}
          <span className="likes"><i className="bi bi-heart" /> {material.likeCount}</span>
        </div>
      </Card.Body>
    </Card>
  )
}

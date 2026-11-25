import { useEffect, useState, type FormEvent } from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCatalog, loadMyDraft, publishMaterialDraft, startMaterialDraft } from '../store/materialsSlice'

export function AddMaterialPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const { draft, error, pending } = useAppSelector((state) => state.materials)
  const [name, setName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [shortDescription, setShortDescription] = useState('')
  const [insulationType, setInsulationType] = useState('Минвата')
  const [thicknessMm, setThicknessMm] = useState(50)
  const [priceRubM2, setPriceRubM2] = useState(281.6)
  const [brand, setBrand] = useState('ТЕХНОНИКОЛЬ')
  const [application, setApplication] = useState('Каркасные стены')

  useEffect(() => {
    if (!user) return
    void dispatch(loadMyDraft()).then((action) => {
      if (!loadMyDraft.fulfilled.match(action) || !action.payload) return
      const loaded = action.payload
      setShortDescription(loaded.shortDescription ?? '')
      setInsulationType(loaded.insulationType ?? 'Минвата')
      setThicknessMm(loaded.thicknessMm ?? 50)
      setPriceRubM2(loaded.priceRubM2 ?? 281.6)
      setBrand(loaded.brand ?? 'ТЕХНОНИКОЛЬ')
      setApplication(loaded.application ?? 'Каркасные стены')
    })
  }, [dispatch, user])
  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) }, [imagePreviewUrl])
  useEffect(() => () => { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl) }, [videoPreviewUrl])
  if (!user) return <Navigate to="/login" replace />

  const start = async (event: FormEvent) => {
    event.preventDefault()
    await dispatch(startMaterialDraft({ name, image: image ?? undefined, video: video ?? undefined }))
  }

  const publish = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    const result = await dispatch(publishMaterialDraft({ id: draft.id, fields: { shortDescription, insulationType, thicknessMm, priceRubM2, brand, application } }))
    if (publishMaterialDraft.fulfilled.match(result)) {
      await dispatch(loadCatalog())
      navigate('/catalog')
    }
  }

  return <main className="form-page"><Container className="content-shell page-section"><div className="form-card">
    {draft ? <>
      <span className="eyebrow">ЧЕРНОВИК</span><h1>Публикация материала</h1><h2 className="draft-material-name">{draft.name}</h2>
      <Form onSubmit={(event) => void publish(event)}>
        <Form.Group><Form.Label>Краткая информация</Form.Label><Form.Control as="textarea" value={shortDescription} maxLength={300} onChange={(event) => setShortDescription(event.target.value)} required /></Form.Group>
        <Form.Group><Form.Label>Тип утеплителя</Form.Label><Form.Control value={insulationType} maxLength={50} onChange={(event) => setInsulationType(event.target.value)} required /></Form.Group>
        <Form.Group><Form.Label>Толщина, мм</Form.Label><Form.Control type="number" min={1} max={1000} value={thicknessMm} onChange={(event) => setThicknessMm(Number(event.target.value))} required /></Form.Group>
        <Form.Group><Form.Label>Цена, ₽/м²</Form.Label><Form.Control type="number" min="0.01" step="0.01" value={priceRubM2} onChange={(event) => setPriceRubM2(Number(event.target.value))} required /></Form.Group>
        <Form.Group><Form.Label>Производитель</Form.Label><Form.Control value={brand} maxLength={100} onChange={(event) => setBrand(event.target.value)} required /></Form.Group>
        <Form.Group><Form.Label>Назначение</Form.Label><Form.Control value={application} maxLength={150} onChange={(event) => setApplication(event.target.value)} required /></Form.Group>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <Button type="submit" disabled={pending > 0}>Опубликовать</Button>
      </Form>
    </> : <>
      <h1>Добавление материала</h1>
      <Form onSubmit={(event) => void start(event)}>
        <Form.Group><Form.Label>Название материала</Form.Label><Form.Control value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required /></Form.Group>
        <Form.Group><Form.Label>Фото</Form.Label><Form.Control type="file" accept="image/*" onChange={(event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null; setImage(file); setImagePreviewUrl(file ? URL.createObjectURL(file) : null) }} /></Form.Group>
        <figure className="image-preview"><img src={imagePreviewUrl ?? '/default-media/default-insulation.jpg'} alt={image ? `Предварительный просмотр: ${image.name}` : 'Изображение по умолчанию'} />{image && <figcaption>Выбрано: {image.name}</figcaption>}</figure>
        <Form.Group><Form.Label>Видео</Form.Label><Form.Control type="file" accept="video/*" onChange={(event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null; setVideo(file); setVideoPreviewUrl(file ? URL.createObjectURL(file) : null) }} /></Form.Group>
        <video className="draft-video-preview" controls src={videoPreviewUrl ?? '/default-media/default-insulation.mp4'} />
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <Button type="submit" disabled={pending > 0}>Далее</Button>
      </Form>
    </>}
  </div></Container></main>
}

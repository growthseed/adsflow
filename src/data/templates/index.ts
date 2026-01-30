import { dvdNatalV2Template } from './dvdNatalV2'

export const templates = {
  'dvd-natal-v2': dvdNatalV2Template,
}

export type TemplateId = keyof typeof templates

export const getTemplate = (id: TemplateId) => templates[id]

export const getAllTemplates = () => Object.values(templates)

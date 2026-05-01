import { Theme } from '../types/ipc'
import { raven } from './raven'
import { bat } from './bat'
import { panther } from './panther'
import { owl } from './owl'
import { viper } from './viper'
import { squid } from './squid'
import { beetle } from './beetle'

export const ANIMAL_THEMES: Theme[] = [
  raven, bat, panther, owl, viper, squid, beetle
]

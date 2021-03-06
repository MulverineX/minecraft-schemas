import { INode, Base } from './Node'
import { locale } from '../Registries'

/**
 * Boolean node with two buttons for true/false
 */
export const BooleanNode = (): INode<boolean> => {
  return {
    ...Base,
    type: () => 'boolean',
    default: () => false,
    render(path, value, mounter) {
      const onFalse = mounter.registerClick(el => {
        path.model.set(path, this.optional() && value === false ? undefined : false)
      })
      const onTrue = mounter.registerClick(el => {
        path.model.set(path, this.optional() && value === true ? undefined : true)
      })
      return ['', `<button${value === false ? ' class="selected"' : ' '} 
          data-id="${onFalse}">${locale('false')}</button>
        <button${value === true ? ' class="selected"' : ' '} 
          data-id="${onTrue}">${locale('true')}</button>`, '']
    },
    suggest: () => ['false', 'true'],
    validate(path, value, errors, options) {
      if (options.loose && typeof value !== 'boolean') {
        value = this.default()
      }
      if (typeof value !== 'boolean' || value === undefined) {
        errors.add(path, 'error.expected_boolean')
      }
      return value
    }
  }
}

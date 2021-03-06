import { INode, Base } from './Node'

export const ListNode = (children: INode): INode<any[]> => {
  return ({
    ...Base,
    type: () => 'list',
    default: () => [],
    navigate(path, index) {
      const nextIndex = index + 1
      const pathElements = path.getArray()
      if (pathElements.length <= nextIndex) {
        return this
      }
      return children.navigate(path, nextIndex)
    },
    pathPush(path, index) {
      return path.push(parseInt(index.toString())).localePush('entry')
    },
    transform(path, value) {
      if (!Array.isArray(value)) return value
      return value.map((obj, index) =>
        children.transform(path.push(index), obj)
      )
    },
    render(path, value, mounter) {
      const onAdd = mounter.registerClick(el => {
        if (!Array.isArray(value)) value = []
        path.model.set(path, [children.default(), ...value])
      })
      const onAddBottom = mounter.registerClick(el => {
        if (!Array.isArray(value)) value = []
        path.model.set(path, [...value, children.default()])
      })
      const suffix = `<button class="add" data-id="${onAdd}"></button>`
        + mounter.nodeInjector(path, mounter)

      let body = ''
      if (Array.isArray(value)) {
        body = value.map((childValue, index) => {
          const removeId = mounter.registerClick(el => path.model.set(path.push(index), undefined))
          const childPath = path.push(index).localePush('entry')
          const category = children.category(childPath)
          const [cPrefix, cSuffix, cBody] = children.render(childPath, childValue, mounter)
          return `<div class="node-entry"><div class="node ${children.type(childPath)}-node" ${category ? `data-category="${category}"` : ''} ${childPath.error()} ${childPath.help()}>
            <div class="node-header">
              <button class="remove" data-id="${removeId}"></button>
              ${cPrefix}
              <label>${path.localePush('entry').locale([`${index}`])}</label>
              ${cSuffix}
            </div>
            ${cBody ? `<div class="node-body">${cBody}</div>` : ''}
            </div></div>`
        }).join('')
        if (value.length > 2) {
          body += `<div class="node-entry">
            <div class="node node-header">
              <button class="add" data-id="${onAddBottom}"></button>
            </div>
          </div>`
        }
      }
      return ['', suffix, body]
    },
    validate(path, value, errors, options) {
      if (options.loose && !Array.isArray(value)) {
        value = this.default()
      }
      if (!Array.isArray(value)) {
        errors.add(path, 'error.expected_list')
        return value
      }
      return value.map((obj, index) =>
        children.validate(path.push(index), obj, errors, options)
      )
    }
  })
}

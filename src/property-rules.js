var betweenValidator = require('./validators/between')
var equalValidator = require('./validators/const')
var oneOfValidator = require('./validators/enum')
var itemsValidator = require('./validators/items')
var maxValidator = require('./validators/maximum')
var maxLengthValidator = require('./validators/maxLength')
var minValidator = require('./validators/minimum')
var minLengthValidator = require('./validators/minLength')
var patternValidator = require('./validators/pattern')
var requiredValidator = require('./validators/required')
var typeValidator = require('./validators/type')
var typeArrayValidator = require('./validators/typeArray')
var uniqueValidator = require('./validators/uniqueItems')
var reduce = require('lodash/reduce')

function getValidationRules(schema) {
  return reduce(schema.properties, function(all, propertySchema, propKey) {
    var validationObj = getPropertyValidationRules(schema, propertySchema, propKey)

    all[propKey] = validationObj
    return all
  }, {})
}

function getPropertyValidationRules(schema, propertySchema, propKey) {
  var validationObj = {}

  function has(name) {
    return propertySchema.hasOwnProperty(name)
  }

  function is(type) {
    return propertySchema.type === type
  }

  if (is('object')) {
    validationObj = getValidationRules(propertySchema)
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
    return validationObj
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.schemaTypes = typeArrayValidator(propertySchema, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (Array.isArray(schema.required) && schema.required.indexOf(propKey) !== -1) {
    validationObj.schemaRequired = requiredValidator(propertySchema)
  }

  if (has('minLength')) {
    validationObj.schemaMinLength = minLengthValidator(propertySchema, propertySchema.minLength)
  }

  if (has('maxLength')) {
    validationObj.schemaMaxLength = maxLengthValidator(propertySchema, propertySchema.maxLength)
  }

  if (has('minItems')) {
    validationObj.schemaMinItems = minLengthValidator(propertySchema, propertySchema.minItems)
  }

  if (has('maxItems')) {
    validationObj.schemaMaxItems = maxLengthValidator(propertySchema, propertySchema.maxItems)
  }

  if (has('minimum') && has('maximum')) {
    validationObj.schemaBetween = betweenValidator(propertySchema, propertySchema.minimum, propertySchema.maximum)
  } else if (has('minimum')) {
    validationObj.schemaMinimum = minValidator(propertySchema, propertySchema.minimum)
  } else if (has('maximum')) {
    validationObj.schemaMaximum = maxValidator(propertySchema, propertySchema.maximum)
  }

  if (has('pattern')) {
    validationObj.schemaPattern = patternValidator(propertySchema, new RegExp(propertySchema.pattern))
  }

  if (has('enum')) {
    validationObj.schemaEnum = oneOfValidator(propertySchema, propertySchema.enum)
  }

  if (has('const')) {
    validationObj.schemaConst = equalValidator(propertySchema, propertySchema.const)
  }

  if (has('uniqueItems')) {
    validationObj.schemaUniqueItems = uniqueValidator(propertySchema)
  }

  if (has('items') && is('array') && propertySchema.items.type === 'object') {
    validationObj.$each = getValidationRules(propertySchema.items)
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules)
  } else if (has('items') && is('array')) {
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules)
  }

  return validationObj
}

module.exports = {
  getPropertyValidationRules: getPropertyValidationRules,
  getValidationRules: getValidationRules
}

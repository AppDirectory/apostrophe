<template>
  <AposInputWrapper
    :modifiers="modifiers" :field="field"
    :error="effectiveError" :uid="uid"
  >
    <template #body>
      <div class="apos-input-wrapper">
        <input
          :class="classes"
          v-model="next" type="color"
          :disabled="field.disabled" :required="field.required"
          :id="uid" :tabindex="tabindex"
        >
      </div>
    </template>
  </AposInputWrapper>
</template>

<script>
import AposInputMixin from 'Modules/@apostrophecms/schema/mixins/AposInputMixin';
import tinycolor from 'tinycolor2';

export default {
  name: 'AposInputColor',
  mixins: [ AposInputMixin ],
  props: {
    // TODO need to work out field-level option overrides
    fieldOptions: {
      type: Object,
      default() {
        return {
          presetColors: [
            '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321',
            '#417505', '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2',
            '#B8E986', '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF'
          ],
          disableAlpha: false,
          disableFields: false,
          format: 'hex8'
        };
      }
    }
  },
  data() {
    return {
      active: false,
      tinyColorObj: null
    };
  },
  computed: {
    buttonOptions() {
      return {
        label: this.field.label,
        type: 'color',
        color: this.value.data || ''
      };
    },
    valueLabel() {
      if (this.next) {
        return this.next;
      } else {
        return 'No color selected';
      }
    },
    classList() {
      return [
        'apos-input-wrapper',
        'apos-color'
      ];
    },
    tabindex () {
      return this.field.disableFocus ? '-1' : '0';
    }
  },
  mounted() {
    this.tinyColorObj = tinycolor(this.next);
  },
  methods: {
    open() {
      this.active = true;
    },
    close() {
      this.active = false;
    },
    update(value) {
      this.tinyColorObj = tinycolor(value.hsl);
      this.next = this.tinyColorObj.toString(this.fieldOptions.format);
    },
    validate(value) {
      if (this.field.required) {
        if (!value) {
          return 'required';
        }
      }
      const color = tinycolor(value);
      return color.isValid() ? false : 'Error';
    }
  }
};
</script>

<style lang="scss" scoped>
  .apos-color {
    display: flex;
    align-items: center;

    & :deep(.vc-sketch) {
      padding: 0;
      box-shadow: none;
    }
  }

  .apos-color__info {
    @include type-base;
    margin-left: 15px;
  }
</style>

import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

type Style = ViewStyle | TextStyle | ImageStyle;
type VariantsConfig = Record<string, Record<string, Style>>;

export type VariantProps<TVariants extends VariantsConfig> = { [K in keyof TVariants]?: keyof TVariants[K] };

/**
 * cva-like helper for React Native styles:
 * `createVariants({ base, variants: { size: { sm, lg } }, defaultVariants: { size: 'sm' } })({ size: 'lg' })`.
 */
export function createVariants<TVariants extends VariantsConfig>(config: {
  base?: Style;
  variants: TVariants;
  defaultVariants?: VariantProps<TVariants>;
}) {
  return (props: VariantProps<TVariants> = {}): Style[] => {
    const styles: Style[] = config.base ? [config.base] : [];

    for (const key of Object.keys(config.variants) as (keyof TVariants)[]) {
      const value = props[key] ?? config.defaultVariants?.[key];
      const style = value === undefined ? undefined : config.variants[key]?.[value as string];

      if (style) {
        styles.push(style);
      }
    }

    return styles;
  };
}

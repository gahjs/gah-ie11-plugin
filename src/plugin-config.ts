import { GahPluginConfig } from '@gah/shared';

export class PluginConfig extends GahPluginConfig {
  public polyfillPackages: { [key: string]: string };
  public polyfillImports: string[];
}

import { GahPlugin, GahPluginConfig, PackageJson } from '@awdware/gah-shared';

import { PluginConfig } from './plugin-config';
import {ie11polyfillPackages, ie11polyfills } from './ie11-polyfills';

/**
 * A gah plugin has to extend the abstract GahPlugin base class and implement the abstract methods.
 */
export class IE11Plugin extends GahPlugin {
  constructor() {
    // Call the constructor with the name of the plugin (only used for logging, does not need to match the package name)
    super('IE11Plugin');
  }

  /**
   * Called after adding the plugin with gah. Used to configure the plugin.
   * @param existingCfg This will be passed by gah and is used to check wheter a property is already configured or not
   */
  public async onInstall(existingCfg: PluginConfig): Promise<GahPluginConfig> {
    return existingCfg;
  }

  /**
   * Called everytime gah gets used for all configured plugins. Register your handlers here.
   */
  public onInit() {
    // Register a handler that gets called synchronously if the corresponding event occured. Some events can be called multiple times!
    this.registerEventListener('INDEX_HTML_ADJUSTED', (event) => {

      if(!event.module?.isHost) {
        return;
      }

      const host = event.module!;

      host.tsConfigFile.tsConfig.compilerOptions.target = 'es5';
      this.fileSystemService.saveObjectToFile(host.tsConfigFile.path, host.tsConfigFile.tsConfig);

      const customPolyfills = this.cfg?.polyfillImports ?? []; 

      const polyfills = [...ie11polyfills, ...customPolyfills, 'zone.js/dist/zone'];

      const polyfillsPath = this.fileSystemService.join(host.basePath, host.srcBasePath, 'polyfills.ts');

      this.fileSystemService.saveFile(polyfillsPath, `// This file got adjusted by the IE11 plugin for gah\n\n\n${  polyfills.map(x => `import '${x}';`).join('\n')}\n`);

      const browserslistPath = this.fileSystemService.join(host.basePath, '.browserslistrc');

      const browserslistrc = this.fileSystemService.readFile(browserslistPath);
      browserslistrc.replace('not IE 9-11', 'IE 9-11');
      this.fileSystemService.saveFile(browserslistPath, browserslistrc);

      this.loggerService.success('plugin done');
    });

    this.registerEventListener('DEPENDENCIES_MERGED', (event) => {
      if(!event.module?.isHost) {
        return;
      }
      const pkgJsonPath = this.fileSystemService.join(event.module.basePath, 'package.json');
      const pkgJson = this.fileSystemService.parseFile<PackageJson>(pkgJsonPath);
      
      const allPackagesWithVersions = Object.keys(ie11polyfillPackages).map(pkgName => {return { name: pkgName, version: ie11polyfillPackages[pkgName] };});
      if(this.cfg && this.cfg.polyfillPackages) {
        allPackagesWithVersions.push(...Object.keys(this.cfg.polyfillPackages).map(pkgName => {return { name: pkgName, version: this.cfg.polyfillPackages[pkgName] };}));
      }

      allPackagesWithVersions.forEach(x => {
        pkgJson.dependencies![x.name] = x.version;
      });

      this.fileSystemService.saveObjectToFile(pkgJsonPath, pkgJson);
    });
  }

  /**
   * For convenience the correctly casted configuration
   */
  private get cfg() {
    return this.config as PluginConfig;
  }
}

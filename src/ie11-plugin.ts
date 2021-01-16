import { GahPlugin, GahPluginConfig } from '@gah/shared';

import { PluginConfig } from './plugin-config';
import { ie11polyfillPackages, ie11polyfills } from './ie11-polyfills';

/**
 * A gah plugin has to extend the abstract GahPlugin base class and implement the abstract methods.
 */
export class IE11Plugin extends GahPlugin {
  private step = 0;
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

  private didStep() {
    this.step++;
    if (this.step === 3) {
      this.loggerService.success('IE11 plugin done');
    }
  }

  /**
   * Called everytime gah gets used for all configured plugins. Register your handlers here.
   */
  public onInit() {
    // Register a handler that gets called synchronously if the corresponding event occured. Some events can be called multiple times!

    this.registerEventListener('BEFORE_ADJUST_ANGULAR_JSON', (event) => {
      if (!event.module?.isHost) {
        return;
      }

      const angularJson = event.ngJson;

      // Adjust build
      angularJson.projects['gah-host'].architect.build.configurations.es5 = {
        tsConfig: './tsconfig.es5.json'
      };
      // Prod
      const prodBuild = { ...angularJson.projects['gah-host'].architect.build.configurations.production };
      prodBuild.tsConfig = './tsconfig.es5.json';
      angularJson.projects['gah-host'].architect.build.configurations['prod-es5'] = prodBuild;

      // Adjust Serve
      if (!angularJson.projects['gah-host'].architect.serve.configurations) {
        angularJson.projects['gah-host'].architect.serve.configurations = {};
      }
      angularJson.projects['gah-host'].architect.serve.configurations.es5 = {
        browserTarget: 'gah-host:build:es5'
      };
      // Prod
      const prodServe = { ...angularJson.projects['gah-host'].architect.serve.configurations.production };
      prodServe.browserTarget = 'gah-host:build:prod-es5';
      angularJson.projects['gah-host'].architect.serve.configurations['prod-es5'] = prodServe;
      this.didStep();
    });

    this.registerEventListener('AFTER_ADJUST_INDEX_HTML', async (event) => {

      if (!event.module?.isHost) {
        return;
      }

      const host = event.module!;

      const customPolyfills = this.cfg?.polyfillImports ?? [];

      const polyfills = [...ie11polyfills, ...customPolyfills, 'zone.js/dist/zone'];

      const polyfillsPath = this.fileSystemService.join(host.basePath, host.srcBasePath, 'polyfills.ts');

      this.fileSystemService.saveFile(polyfillsPath, `// This file got adjusted by the IE11 plugin for gah\n\n\n${polyfills.map(x => `import '${x}';`).join('\n')}\n`);

      const browserslistPath = this.fileSystemService.join(host.basePath, '.browserslistrc');

      let browserslistrc = await this.fileSystemService.readFile(browserslistPath);
      browserslistrc = browserslistrc.replace('not IE 9-11', 'IE 9-11');
      await this.fileSystemService.saveFile(browserslistPath, browserslistrc);

      await this.fileSystemService.copyFile(this.fileSystemService.join(__dirname, '../assets/tsconfig.es5.json'), host.basePath);
      this.didStep();
    });

    this.registerEventListener('BEFORE_MERGE_DEPENDENCIES', (event) => {
      if (!event.module?.isHost) {
        return;
      }
      const pkgJson = event.pkgJson;

      const allPackagesWithVersions = Object.keys(ie11polyfillPackages).map(pkgName => { return { name: pkgName, version: ie11polyfillPackages[pkgName] }; });
      if (this.cfg && this.cfg.polyfillPackages) {
        allPackagesWithVersions.push(...Object.keys(this.cfg.polyfillPackages).map(pkgName => { return { name: pkgName, version: this.cfg.polyfillPackages[pkgName] }; }));
      }

      allPackagesWithVersions.forEach(x => {
        pkgJson.dependencies![x.name] = x.version;
      });
      this.didStep();
    });
  }

  /**
   * For convenience the correctly casted configuration
   */
  private get cfg() {
    return this.config as PluginConfig;
  }
}

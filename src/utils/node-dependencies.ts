import { get } from 'http';
import { NodeDependency, NodeDependencyType } from 'schematics-utilities';

interface NodeDep {
  name: string;
  type: NodeDependencyType;
}

/**
 * Attempt to retrieve the latest package version from NPM
 * Return an optional "latest" version in case of error
 * @param packageName
 */
export function getLatestNodeVersion({ name, type }: NodeDep): Promise<NodeDependency> {
  const DEFAULT_VERSION = 'latest';

  return new Promise((resolve) => {
    return get(`http://registry.npmjs.org/${name}`, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(rawData);
          const version = (response && response['dist-tags']) || {};

          resolve(buildPackage({ name, type }, version.latest));
        } catch (e) {
          resolve(buildPackage({ name, type }));
        }
      });
    }).on('error', () => resolve(buildPackage({ name, type })));
  });

  function buildPackage(
    { name, type }: NodeDep,
    version: string = DEFAULT_VERSION,
  ): NodeDependency {
    return { name, version, type, overwrite: true };
  }
}

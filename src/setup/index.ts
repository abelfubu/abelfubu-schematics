import {
  apply,
  applyTemplates,
  branchAndMerge,
  chain,
  FileEntry,
  forEach,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  getProject,
  getWorkspace,
  NodeDependencyType,
} from 'schematics-utilities';
import { parseJsonAtPath } from '../utils/json-utils';
import { getLatestNodeVersion } from '../utils/node-dependencies';

const dependencies = [
  { name: 'prettier', type: NodeDependencyType.Dev },
  { name: 'eslint', type: NodeDependencyType.Dev },
  { name: 'stylelint', type: NodeDependencyType.Dev },
  { name: 'stylelint-config-sass-guidelines', type: NodeDependencyType.Dev },
  { name: 'husky', type: NodeDependencyType.Dev },
  { name: 'lint-staged', type: NodeDependencyType.Dev },
];

function addDependencies() {
  return (tree: Tree, context: SchematicContext) => {
    dependencies.forEach(async (dependency) =>
      addPackageJsonDependency(tree, await getLatestNodeVersion(dependency)),
    );
    context.addTask(new NodePackageInstallTask());
  };
}

function updatePkgJson() {
  return (tree: Tree) => {
    const packageJson = parseJsonAtPath(tree, './package.json');
    const parsedJson = JSON.parse(packageJson.text);
    // parsedJson.scripts.prepare = 'husky install';
    tree.overwrite('./package.json', JSON.stringify(parsedJson, null, 2));
  };
}

function addFiles() {
  return (tree: Tree) => {
    const templateSource = apply(url('./files'), [
      move('/'),
      forEach((file: FileEntry) => {
        if (tree.exists(file.path)) {
          tree.overwrite(file.path, file.content);
        }
        return file;
      }),
    ]);
    return branchAndMerge(chain([mergeWith(templateSource)]));
  };
}

function addFilesMap() {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProject(workspace, Object.keys(workspace.projects)[0]);
    const templateSource = apply(url('./maps'), [
      applyTemplates({ prefix: project.prefix }),
      move('/'),
    ]);
    return branchAndMerge(chain([mergeWith(templateSource)]));
  };
}

export default function (options: any): Rule {
  return (_: Tree, context: SchematicContext) => {
    context.logger.info('My Schematic: ' + JSON.stringify(options));
    return chain([addDependencies(), updatePkgJson(), addFiles(), addFilesMap()]);
  };
}

import {writeFileSync} from "fs";

type Tracker = {
  paths: Record<
    string,
    Record<
      string,
      {start: bigint, end?: bigint, props: Record<string, unknown>}
    >
  >,
  start(file: string, op: string, props?: Record<string, unknown>): void;
  note(file: string, op: string, props?: Record<string, unknown>): void;
  end(file: string, op: string, props?: Record<string, unknown>): void;
}

const basePath = process.cwd();

process.on('beforeExit', () => {
  const dumpTo = basePath + `/tracking.${process.pid}.json`;
  console.log("Dumping tracking to %s", dumpTo);
  writeFileSync(dumpTo, JSON.stringify(tracker.paths, stripBasePath));
});

function stripBasePath(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(basePath, '');
  }
  return value;
}

export const tracker: Tracker = {
  paths: {},

  start(file, op, props) {
    let tracked = tracker.paths[file];
    if (!tracked) {
      tracked = (tracker.paths[file] = {});
    }
    tracked[op] = {
      start: process.hrtime.bigint(),
      props: props ?? {}
    }
  },

  note(file, op, props) {
    Object.assign(tracker.paths[file][op].props, props)
  },

  end(file, op, props) {
    tracker.note(file, op, props)
    const tracked = tracker.paths[file][op];
    tracked.end = process.hrtime.bigint();
    const duration = Number(tracked.end - tracked.start)/1e6 // ns -> ms;
    const path = file.replace(basePath, '');
    console.log(path, process.pid, op, duration, tracked.props)
  }
}

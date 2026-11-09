import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const mainRelative =
  "artifacts/animated-effects/src/main.ts";

const stableRelative =
  "artifacts/animated-effects/src/pack09/uiPolishStable.ts";

const mainFile =
  path.join(
    root,
    mainRelative,
  );

const stableFile =
  path.join(
    root,
    stableRelative,
  );

function fail(message) {
  console.error(
    "\nERROR:",
    message,
  );
  process.exit(1);
}

if (
  !fs.existsSync(
    path.join(
      root,
      "pnpm-workspace.yaml",
    ),
  )
) {
  fail(
    "Uruchom z katalogu głównego aplikacja-turnieje-live.",
  );
}

if (
  !fs.existsSync(
    mainFile,
  )
) {
  fail(
    "Brak pliku: " +
    mainRelative,
  );
}

let main =
  fs.readFileSync(
    mainFile,
    "utf8",
  );

if (
  main.includes(
    "AE_STABLE_UI_POLISH_PACK_20",
  )
) {
  console.log(
    "Stable UI Polish Pack 20 jest już zainstalowany.",
  );
  process.exit(0);
}

if (
  !main.includes(
    "AE_DIAGNOSTIC_ISOLATION_PACK_18",
  )
) {
  fail(
    "Pack 20 oczekuje obecnego stanu diagnostycznego Pack 18/19.",
  );
}

const stamp =
  new Date()
    .toISOString()
    .replace(
      /[:.]/g,
      "-",
    )
    .replace(
      "T",
      "_",
    )
    .replace(
      "Z",
      "",
    );

const backupRoot =
  path.join(
    root,
    ".ae-pack-backup",
    `pack-20-stable-ui-polish-${stamp}`,
  );

const touched = [
  mainRelative,
  stableRelative,
];

const existed = [];

for (
  const relative of
    touched
) {
  const source =
    path.join(
      root,
      relative,
    );

  if (
    !fs.existsSync(
      source,
    )
  ) {
    continue;
  }

  existed.push(
    relative,
  );

  const backup =
    path.join(
      backupRoot,
      relative,
    );

  fs.mkdirSync(
    path.dirname(
      backup,
    ),
    {
      recursive:
        true,
    },
  );

  fs.copyFileSync(
    source,
    backup,
  );
}

fs.mkdirSync(
  backupRoot,
  {
    recursive:
      true,
  },
);

fs.writeFileSync(
  path.join(
    backupRoot,
    "backup-manifest.json",
  ),
  JSON.stringify(
    {
      touched,
      existed,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

const stableSource =
  Buffer.from(
    "6c657420696e7374616c6c6564203d2066616c73653b0a0a66756e6374696f6e206e6f726d616c697a6554657874280a202076616c75653a20737472696e67207c206e756c6c2c0a293a20737472696e67207b0a202072657475726e20280a2020202076616c7565203f3f0a2020202022220a2020290a202020202e7472696d28290a202020202e746f4c6f63616c654c6f77657243617365280a20202020202022706c222c0a20202020293b0a7d0a0a66756e6374696f6e2066696e64496e73706563746f7247726f7570280a2020696e73706563746f723a2048544d4c456c656d656e742c0a20207469746c653a20737472696e672c0a293a2048544d4c456c656d656e74207c206e756c6c207b0a2020636f6e737420746172676574203d0a202020206e6f726d616c697a6554657874280a2020202020207469746c652c0a20202020293b0a0a202072657475726e20280a2020202041727261792e66726f6d280a202020202020696e73706563746f722e717565727953656c6563746f72416c6c3c48544d4c456c656d656e743e280a2020202020202020223a73636f7065203e202e696e73706563746f722d67726f7570222c0a202020202020292c0a20202020292e66696e64280a2020202020202867726f757029203d3e207b0a2020202020202020696620280a2020202020202020202067726f75702e6d617463686573280a202020202020202020202020222e61652d7061636b30362d696e73706563746f72222c0a20202020202020202020290a202020202020202029207b0a2020202020202020202072657475726e2066616c73653b0a20202020202020207d0a0a2020202020202020636f6e73742068656164696e67203d0a2020202020202020202067726f75702e717565727953656c6563746f72280a202020202020202020202020222e696e73706563746f722d67726f75702d68656164696e67207374726f6e67222c0a2020202020202020202029203f3f0a2020202020202020202067726f75702e717565727953656c6563746f72280a202020202020202020202020227374726f6e67222c0a20202020202020202020293b0a0a202020202020202072657475726e20280a202020202020202020206e6f726d616c697a6554657874280a20202020202020202020202068656164696e673f2e74657874436f6e74656e74203f3f0a2020202020202020202020206e756c6c2c0a2020202020202020202029203d3d3d0a202020202020202020207461726765740a2020202020202020293b0a2020202020207d2c0a2020202029203f3f0a202020206e756c6c0a2020293b0a7d0a0a6578706f72742066756e6374696f6e206170706c795061636b30395569506f6c697368537461626c6528293a0a2020766f6964207b0a2020636f6e737420696e73706563746f72203d0a20202020646f63756d656e742e717565727953656c6563746f723c48544d4c456c656d656e743e280a2020202020202223696e73706563746f72222c0a20202020293b0a0a20206966202821696e73706563746f7229207b0a2020202072657475726e3b0a20207d0a0a2020636f6e7374207469746c65203d0a20202020696e73706563746f722e717565727953656c6563746f723c48544d4c456c656d656e743e280a202020202020223a73636f7065203e202e696e73706563746f722d7469746c65222c0a20202020293b0a0a2020636f6e73742076617269616e74203d0a20202020696e73706563746f722e717565727953656c6563746f723c48544d4c456c656d656e743e280a202020202020223a73636f7065203e202e696e73706563746f722d76617269616e742d70616e656c222c0a20202020293b0a0a2020636f6e737420636861726163746572203d0a20202020696e73706563746f722e717565727953656c6563746f723c48544d4c456c656d656e743e280a202020202020223a73636f7065203e205b646174612d7061636b30392d6368617261637465725d222c0a20202020293b0a0a2020636f6e73742072616e646f6d6e657373203d0a20202020696e73706563746f722e717565727953656c6563746f723c48544d4c456c656d656e743e280a202020202020223a73636f7065203e202e61652d7061636b30362d696e73706563746f72222c0a20202020293b0a0a2020636f6e737420636f6c6f72203d0a20202020696e73706563746f722e717565727953656c6563746f723c48544d4c456c656d656e743e280a202020202020223a73636f7065203e202e696e73706563746f722d636f6c6f722d70616e656c222c0a20202020293b0a0a2020636f6e7374207072696d617279203d0a2020202066696e64496e73706563746f7247726f7570280a202020202020696e73706563746f722c0a20202020202022506f64737461776f7765222c0a20202020293b0a0a2020636f6e7374207472616e73666f726d203d0a2020202066696e64496e73706563746f7247726f7570280a202020202020696e73706563746f722c0a202020202020225472616e73666f726d61636a61222c0a20202020293b0a0a2020636f6e737420617070656172616e6365203d0a2020202066696e64496e73706563746f7247726f7570280a202020202020696e73706563746f722c0a202020202020225779676cc48564222c0a20202020293b0a0a2020636f6e737420636f6d706f736974696f6e203d0a2020202066696e64496e73706563746f7247726f7570280a202020202020696e73706563746f722c0a202020202020224b6f6d706f7a79636a61222c0a20202020293b0a0a2020636f6e7374206f726465726564203d205b0a202020207469746c652c0a2020202076617269616e742c0a202020206368617261637465722c0a202020207072696d6172792c0a20202020636f6c6f722c0a2020202072616e646f6d6e6573732c0a202020207472616e73666f726d2c0a20202020617070656172616e63652c0a20202020636f6d706f736974696f6e2c0a20205d2e66696c746572280a20202020280a2020202020206974656d2c0a20202020293a206974656d2069732048544d4c456c656d656e74203d3e0a202020202020426f6f6c65616e280a20202020202020206974656d2c0a202020202020292c0a2020293b0a0a20202f2a0a202020204e6f204d75746174696f6e4f627365727665722e0a20202020546869732066756e6374696f6e2069732063616c6c656420696d6d6564696174656c792061667465722074686520656469746f7220706572666f726d730a20202020697473206f776e2072656e6465722c20736f2069742063616e6e6f74207265637572736976656c79207472696767657220697473656c662e0a20202a2f0a2020666f7220280a20202020636f6e7374206974656d206f660a2020202020206f7264657265640a202029207b0a20202020696e73706563746f722e617070656e644368696c64280a2020202020206974656d2c0a20202020293b0a20207d0a0a2020696e73706563746f722e636c6173734c6973742e616464280a202020202261652d756931302d696e73706563746f722d6f726465726564222c0a2020293b0a7d0a0a66756e6374696f6e2075706461746556696577706f72745661726961626c6528293a0a2020766f6964207b0a2020646f63756d656e740a202020202e646f63756d656e74456c656d656e740a202020202e7374796c650a202020202e73657450726f7065727479280a202020202020222d2d61652d756931302d7668222c0a20202020202060247b77696e646f772e696e6e65724865696768747d7078602c0a20202020293b0a7d0a0a6578706f72742066756e6374696f6e20696e7374616c6c5061636b30395569506f6c697368537461626c6528293a0a2020766f6964207b0a202069662028696e7374616c6c656429207b0a2020202072657475726e3b0a20207d0a0a2020696e7374616c6c6564203d20747275653b0a0a202075706461746556696577706f72745661726961626c6528293b0a0a202077696e646f772e6164644576656e744c697374656e6572280a2020202022726573697a65222c0a2020202075706461746556696577706f72745661726961626c652c0a202020207b0a202020202020706173736976653a20747275652c0a202020207d2c0a2020293b0a7d0a",
    "hex",
  ).toString(
    "utf8",
  );

fs.mkdirSync(
  path.dirname(
    stableFile,
  ),
  {
    recursive:
      true,
  },
);

fs.writeFileSync(
  stableFile,
  stableSource,
  "utf8",
);

/*
  Keep the old observer-based UI polish disabled.
  Add the stable replacement instead.
*/
const importAnchor =
  /import\s*\{\s*installPack09UiPolish\s*,?\s*\}\s*from\s*["']\.\/pack09\/uiPolish["']\s*;?/m;

const importMatch =
  main.match(
    importAnchor,
  );

const stableImport =
`import {
  applyPack09UiPolishStable,
  installPack09UiPolishStable,
} from "./pack09/uiPolishStable";`;

if (
  !main.includes(
    'from "./pack09/uiPolishStable"',
  )
) {
  if (
    importMatch
  ) {
    main =
      main.replace(
        importAnchor,
        importMatch[0] +
        "\n\n" +
        stableImport,
      );
  } else if (
    main.includes(
      'import "./style.css";',
    )
  ) {
    main =
      main.replace(
        'import "./style.css";',
        'import "./style.css";' +
        "\n\n" +
        stableImport,
      );
  } else {
    fail(
      "Nie znaleziono bezpiecznego miejsca na import stable UI polish.",
    );
  }
}

/*
  Make sure the problematic observer-based module stays disabled.
*/
main =
  main.replace(
    "const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = true;",
    "const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;",
  );

/*
  Run the stable reordering exactly once per normal editor render,
  immediately after the inspector has been rebuilt.
*/
const renderNeedle =
`  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );
  }
}`;

const renderReplacement =
`  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );

    applyPack09UiPolishStable();
  }
}`;

if (
  !main.includes(
    "applyPack09UiPolishStable();",
  )
) {
  if (
    !main.includes(
      renderNeedle,
    )
  ) {
    fail(
      "Nie znaleziono oczekiwanego renderEditor() w main.ts.",
    );
  }

  main =
    main.replace(
      renderNeedle,
      renderReplacement,
    );
}

/*
  Install only the safe resize helper once.
*/
const diagnosticMarker =
  "/* AE_DIAGNOSTIC_ISOLATION_PACK_18";

if (
  !main.includes(
    "installPack09UiPolishStable();",
  )
) {
  const markerIndex =
    main.indexOf(
      diagnosticMarker,
    );

  if (
    markerIndex < 0
  ) {
    fail(
      "Nie znaleziono miejsca instalacji modułów diagnostycznych.",
    );
  }

  main =
    main.slice(
      0,
      markerIndex,
    ) +
    `/* AE_STABLE_UI_POLISH_PACK_20 */\ninstallPack09UiPolishStable();\n\n` +
    main.slice(
      markerIndex,
    );
}

fs.writeFileSync(
  mainFile,
  main,
  "utf8",
);

const rollbackPath =
  path.join(
    root,
    "ae-stable-ui-polish-pack-20-rollback.mjs",
  );

const rollback =
`import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = ${JSON.stringify(
  backupRoot,
)};

const manifest =
  JSON.parse(
    fs.readFileSync(
      path.join(
        backupRoot,
        "backup-manifest.json",
      ),
      "utf8",
    ),
  );

const existed =
  new Set(
    manifest.existed,
  );

for (
  const relative of
    manifest.touched
) {
  const target =
    path.join(
      root,
      relative,
    );

  const backup =
    path.join(
      backupRoot,
      relative,
    );

  if (
    existed.has(
      relative,
    )
  ) {
    fs.copyFileSync(
      backup,
      target,
    );
  } else {
    fs.rmSync(
      target,
      {
        force: true,
      },
    );
  }
}

console.log(
  "Stable UI Polish Pack 20 cofnięty.",
);
`;

fs.writeFileSync(
  rollbackPath,
  rollback,
  "utf8",
);

console.log("");
console.log("=================================================");
console.log(" Animated Effects Stable UI Polish Pack 20 INSTALLED");
console.log("=================================================");
console.log("");
console.log("Diagnoza:");
console.log(" - Pack06Polish02 + Pack08UiQa + Pack09Customization działają razem");
console.log(" - problematyczny observer-based Pack09UiPolish pozostaje wyłączony");
console.log("");
console.log("Zastąpiono go bezpiecznym wariantem:");
console.log(" - ZERO MutationObserverów");
console.log(" - kolejność inspectora ustawiana tylko po normalnym renderEditor()");
console.log(" - zachowany viewport helper --ae-ui10-vh");
console.log(" - brak obserwowania biblioteki i brak samonapędzających mutacji DOM");
console.log("");
console.log("Backup:", path.relative(root, backupRoot));
console.log("Rollback: .\\ae-stable-ui-polish-pack-20-rollback.mjs");
console.log("");
console.log("Teraz:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");

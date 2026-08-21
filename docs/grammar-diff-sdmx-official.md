# Écarts de grammaire ANTLR4 par rapport à SDMX VTL **2.2** (officiel)

Ce document compare les fichiers **`src/lib/Vtl.g4`** et **`src/lib/VtlTokens.g4`** de ce dépôt à la grammaire **VTL 2.2** publiée sur la branche `develop` du dépôt SDMX. Les fichiers locaux sont encore issus d’une base **2.1 / fork INSEE** (commentaires d’en-tête) ; l’objectif projet est de **s’aligner sur 2.2** partout.

## Référence officielle (VTL 2.2)

| Élément | Emplacement |
|--------|-------------|
| Dépôt | [sdmx-twg/vtl](https://github.com/sdmx-twg/vtl) |
| Branche | `develop` |
| Dossier | [`v2.2/src/main/antlr4/org/sdmx/vtl`](https://github.com/sdmx-twg/vtl/tree/develop/v2.2/src/main/antlr4/org/sdmx/vtl) |
| Fichiers | [`Vtl.g4`](https://github.com/sdmx-twg/vtl/blob/develop/v2.2/src/main/antlr4/org/sdmx/vtl/Vtl.g4), [`VtlTokens.g4`](https://github.com/sdmx-twg/vtl/blob/develop/v2.2/src/main/antlr4/org/sdmx/vtl/VtlTokens.g4) |

**Note :** le contenu exact du dépôt upstream évolue ; pour une vérification à l’instant T, comparer directement les fichiers sur GitHub ou via `git diff` / `curl` sur les URLs `raw.githubusercontent.com`.

---

## 1. Changement structurel majeur : parseur et lexer séparés

| Aspect | Officiel 2.2 | Ce dépôt |
|--------|----------------|----------|
| Fichier parseur | `parser grammar Vtl;` + `options { tokenVocab=VtlTokens; }` | `grammar Vtl;` + `import VtlTokens;` (grammaire **combinée**) |

L’outil officiel génère **deux** artefacts ANTLR distincts (lexer + parser) liés par `tokenVocab`. Ce dépôt utilise le mode **grammar unifiée** avec `import`, ce qui est équivalent pour la génération côté TypeScript mais **diffère** de la mise en page et des options du dépôt SDMX.

---

## 2. Vue d’ensemble des écarts fonctionnels

| Domaine | Officiel 2.2 | Ce dépôt (état actuel) |
|---------|----------------|-------------------------|
| Entrée | `(statement EOL)*` | **`statementWithComments`** + règles **`comment`** |
| `exprComponent` | Présent (filtres, having, cast composant, chaînes parallèles, etc.) | **Commenté / retiré** ; clauses en **`expr`** |
| `CASE` | `CASE (WHEN condExpr+=expr THEN thenExpr+=expr)+ ELSE …` | Forme avec premier `WHEN` explicite et répétition `(WHEN … THEN …)*` |
| `datasetClause` | `customPivotClause` **exclu** (commenté dans la liste) | **`customPivotClause` activé** |
| `filterClause` | `FILTER exprComponent` | **`FILTER expr`** |
| `havingClause` | `HAVING exprComponent` | **`HAVING expr`** |
| Jointures (`joinOperators`) | `INNER_JOIN` / `LEFT_JOIN` / `FULL_JOIN` / `CROSS_JOIN` avec **`usingClause`**, **`nvlJoinClause`**, corps dédiés | Modèle **plus ancien** : regroupement `INNER_JOIN \| LEFT_JOIN` et `FULL_JOIN \| CROSS_JOIN` **sans** les règles NVL / USING du 2.2 |
| Distance de chaînes | Opérateur **`string_distance`** avec choix de **méthode** (`levenshtein`, `damerau_levenshtein`, `hamming`, `jaro_winkler`) dans `stringOperators` | Règle séparée **`distanceOperators`** avec uniquement **`levenshtein(...)`** (héritage fork) ; **pas** le modèle `STRING_DISTANCE(method, …)` du 2.2 |
| `groupingClause` / `TIME_AGG` | Fréquence : **`STRING_CONSTANT`** dans `TIME_AGG` ; `GROUP ALL` **sans** expression dataset intermédiaire comme dans le fork Trevas | Fréquence : règle **`TIME_UNIT`** ; branche **`GROUP ALL expr`** (alignement exécution Trevas, pas sur le 2.2 officiel) |
| `parameterItem` / défaut | `DEFAULT scalarItem` | **`DEFAULT constant`** (pas de raccourci `CAST` via `scalarItem`) |
| `EVAL` | `varID \| scalarItem`, `RETURNS evalDatasetType` | **`varId \| constant`**, **`RETURNS datasetType`** |
| `subspaceClauseItem` | `componentID EQ scalarItem` | **`componentID EQ constant`** |
| `valueDomainName` | `IDENTIFIER` | **`IDENTIFIER \| signedInteger \| signedNumber`** (extension outil) |
| Littéraux numériques (lexer) | `INTEGER_CONSTANT : [0-9]+` (sans signe au lexer) | **`MINUS?` + chiffres**, `NUMBER_CONSTANT` assoupli (commentaires d’extension) |
| Commentaires | `ML_COMMENT` / `SL_COMMENT` → **canal 2** | **Canal par défaut** (pour les attacher au parse tree) |
| Lexique identifiants | **`IDENTIFIER`** enrichi (fragments `ID_PART`, `SDMX_VERSION`, URN-like) | Règle **`IDENTIFIER`** plus **proche 2.1** (moins de variantes SDMX 2.2) |

---

## 3. Détail — `Vtl.g4`

### 3.1 Point d’entrée et commentaires

- **2.2 :** `start : (statement EOL)* EOF`.
- **Ce dépôt :** `statementWithComments`, `comment`, afin d’obtenir les commentaires dans l’AST.

### 3.2 Sous-grammaire « composant »

La 2.2 conserve **`exprComponent`**, **`functionsComponents`**, opérateurs « Component » parallèles, **`FILTER exprComponent`**, **`HAVING exprComponent`**, etc.

**Ce dépôt** les a **commentés** et réduit à **`expr`** là où le fork expose encore la clause.

### 3.3 Expression `CASE`

Même type d’écart qu’avant : forme officielle avec labels `+=` vs forme développée du fork (arbre de parse et noms de champs différents pour les visiteurs).

### 3.4 Clauses dataset

- **`customPivotClause` :** absent de la liste dans la 2.2 officielle ; **présent** ici.

### 3.5 Jointures

La **2.2** introduit une structure de jointure plus fine (`usingClause`, `nvlJoinClause`, labels `innerJoinExpr`, `leftJoinExpr`, etc.). **Ce dépôt** reprend encore l’ancienne forme **2.1 / Trevas** (deux branches `joinKeyword=…`). Pour être conforme au parseur 2.2, il faudrait **porter** ces règles et les non-terminaux associés depuis [`Vtl.g4` officiel 2.2](https://github.com/sdmx-twg/vtl/blob/develop/v2.2/src/main/antlr4/org/sdmx/vtl/Vtl.g4).

### 3.6 Distance entre chaînes

- **2.2 :** dans `stringOperators`, appel du style  
  `STRING_DISTANCE LPAREN method=stringDistanceMethods COMMA string1=expr COMMA string2=expr RPAREN`  
  avec `stringDistanceMethods` = `LEVENSHTEIN_METHOD` \| `DAMERAU_LEVENSHTEIN_METHOD` \| `HAMMING_METHOD` \| `JARO_WINKLER_METHOD`.

- **Ce dépôt :** règle **`distanceOperators`** séparée et appel **`LEVENSHTEIN LPAREN …`** (un seul mot-clé), **sans** `STRING_DISTANCE` ni les autres méthodes.

Pour l’alignement 2.2, il faut **remplacer** l’approche « Levenshtein seul » par le couple **`STRING_DISTANCE` + méthodes** du lexer officiel.

### 3.7 Agrégation / `GROUP ALL`

- **2.2 :** `GROUP ALL` suivi d’options `TIME_AGG` basées sur **`STRING_CONSTANT`** (pas de `expr` globale comme dans certaines branches Trevas).
- **Ce dépôt :** **`TIME_UNIT`** dans `TIME_AGG` et **`GROUP ALL expr`** : écart **volontaire** côté exécution / fork, non superposable à la 2.2 telle qu’à l’upstream.

### 3.8 Numériques signés et `constant`

La 2.2 utilise **`signedInteger` / `signedNumber`** au parseur et des littéraux **non signés** au lexer (`INTEGER_CONSTANT : [0-9]+`).

**Ce dépôt** combine souvent **signe au lexer** (`MINUS?` dans `INTEGER_CONSTANT`) **et** règles **`(MINUS|PLUS)?`** au parseur : risque de **redondance** ou d’ambiguïtés ; à harmoniser lors de la migration 2.2.

### 3.9 `valueDomainName`

Extension locale : littéraux numériques signés en plus des identifiants.

### 3.10 `parameterItem`, `EVAL`, sous-espace

Même écart qu’avec la spec « pure » : **`scalarItem`** vs **`constant`**, **`evalDatasetType`** vs **`datasetType`**, **`subspaceClauseItem`** avec ou sans `CAST` scalaire.

---

## 4. Détail — `VtlTokens.g4`

### 4.1 Organisation du fichier

- **2.2 :** fichier **court** (~248 lignes), sections « Non-keyword », « Keyword », « String distance method tokens », littéraux, `IDENTIFIER` structuré, WS / commentaires en fin.
- **Ce dépôt :** fichier **long** (~410 lignes), ordre et regroupement **hérités 2.1 / INSEE**.

### 4.2 Mots réservés et opérateurs de distance

| Concept | 2.2 officiel | Ce dépôt |
|---------|----------------|----------|
| Année / mois | `YEAR_OP`, `MONTH_OP` (littéraux `'getyear'`, `'getmonth'`) | `GETYEAR`, `GETMONTH` (même surface, **autres noms de token**) |
| Distance | Mot-clé **`string_distance`** + tokens **`LEVENSHTEIN_METHOD`**, `DAMERAU_LEVENSHTEIN_METHOD`, etc. | Mot-clé **`levenshtein`** seul (`LEVENSHTEIN`) ; **pas** `STRING_DISTANCE` ni les méthodes multiples |

### 4.3 Littéraux

- **2.2 :** `INTEGER_CONSTANT : [0-9]+` ; `NUMBER_CONSTANT : INTEGER_CONSTANT '.' INTEGER_CONSTANT`.
- **Ce dépôt :** signe optionnel et fraction assouplie (voir fichier source).

### 4.4 Commentaires

- **2.2 :** `-> channel(2)` (hors canal principal).
- **Ce dépôt :** pas de redirection — commentaires **visibles** pour **`statementWithComments`**.

---

## 5. Alignement avec Trevas (Java)

Le moteur [Trevas](https://github.com/InseeFrLab/Trevas) partage une grande partie du fork (composants commentés, `FILTER expr`, `TIME_UNIT`, ancien modèle de jointures, etc.). Les **mêmes priorités** s’appliquent pour une montée **2.2** : lexer/parser officiels, puis réintégrer les extras **TS** (commentaires dans l’AST, extensions `valueDomainName`) de manière documentée.

---

## 6. Pistes d’alignement (résumé)

1. **Baseline 2.2 SDMX :** importer `Vtl.g4` / `VtlTokens.g4` depuis [`v2.2/.../org/sdmx/vtl`](https://github.com/sdmx-twg/vtl/tree/develop/v2.2/src/main/antlr4/org/sdmx/vtl), garder la **séparation** `parser grammar` / `lexer grammar` ou reproduire le **vocabulaire de tokens** à l’identique dans la grammaire combinée.
2. **Rejouer les extensions locales :** `statementWithComments` (éventuellement grammaire dérivée ou canal mixte), `valueDomainName`, et décider du sort de **`GROUP ALL expr`** vs spec 2.2.
3. **Remplacer** `distanceOperators` + `LEVENSHTEIN` par le bloc **`STRING_DISTANCE`** + méthodes du 2.2.
4. **Porter** les règles de **jointure 2.2** (`usingClause`, `nvlJoinClause`, …) avant de supprimer l’ancien `joinOperators`.

---

## Voir aussi

- [Grammaire ANTLR VTL 2.2 — répertoire officiel](https://github.com/sdmx-twg/vtl/tree/develop/v2.2/src/main/antlr4/org/sdmx/vtl)
- Trevas : `vtl-parser/src/main/antlr4/fr/insee/vtl/parser/` (à synchroniser avec la même baseline 2.2)

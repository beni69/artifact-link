import { markdownTable as mdTable } from "markdown-table";

export function groupTable(
    list: string[],
    group: RegExp,
    transform = (x: string) => x
) {
    const table: string[][] = [["<!-- empty -->"]];
    for (const item of list) {
        const res = group.exec(item);
        if (!res?.groups?.col || !res?.groups.row)
            throw new Error(`invalid regex: ${group}, no match in ${item}`);
        const { col, row } = res.groups;

        let c = table[0].indexOf(col);
        if (c < 0) table[0].push(col);
        c = table[0].indexOf(col);

        let r = table.find(x => x[0] === row);
        if (!r) {
            r = [row];
            table.push(r);
        }
        r.splice(c, 0, transform(item));
    }
    return mdTable(table);
}

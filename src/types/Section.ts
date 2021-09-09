import { Link } from "./Link";

export type Section = {
    name: string,
    description: string,
    content: Link[] | string
}
import { Section } from "./Section";

export type Profile = {
    title: string,
    name: string,
    description: string,
    url: string,
    sections: Section[]
}
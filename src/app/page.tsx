import Link from "next/link";

  export default function Home() {
  return (
    <ul>
      <li key={'lista'}>
        <Link href={`/list/`}>{"Lista de unidades"}</Link>
      </li>
  </ul>
  );
}

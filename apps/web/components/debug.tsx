export default function Pre(props: { value: unknown }) {
  return (
    <>
      <pre>{JSON.stringify(props.value, null, 2)}</pre>
    </>
  )
}

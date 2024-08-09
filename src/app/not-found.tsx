// app/not-found.tsx
export default function NotFound() {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1
            className="next-error-h1 border-r pr-6 mr-6 text-2xl antialiased font-semibold inline-block"
            style={{
              lineHeight: "49px",
            }}
          >
            404
          </h1>
          <div className="inline-block">
            <h2
              className=""
              style={{
                lineHeight: "49px",
                margin: 0,
              }}
            >
              This page could not be found.
            </h2>
          </div>
        </div>
      </div>
    )
  }
  
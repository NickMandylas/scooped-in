import axios from "axios";
import { Formik, Field, Form } from "formik";

interface loginPageProps {}

const loginPage: React.FC<loginPageProps> = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        maxHeight: "-webkit-fill-available",
      }}
    >
      <div style={{ width: "300px" }}>
        <p style={{ fontWeight: 500, fontSize: "1.5rem", margin: 0 }}>Login</p>
        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={async ({ email, password }) => {
            axios.defaults.withCredentials = true;

            const data = await axios.post(
              "http://192.168.114.163:4000/creator/login",
              {
                email,
                password,
              },
              { withCredentials: true },
            );

            console.log(data);

            const check = await axios.get(
              "http://192.168.114.163:4000/creator",
              { withCredentials: true },
            );
            console.log(check.data);
          }}
        >
          <Form
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <label>Email Address:</label>
            <Field
              id="email"
              name="email"
              placeholder="watcher@scooped.in"
              style={{ marginBottom: 8 }}
            />
            <label>Password:</label>
            <Field
              id="password"
              name="password"
              placeholder="•••••••••••••••"
            />
            <button style={{ marginTop: 16 }} type="submit">
              Submit
            </button>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default loginPage;

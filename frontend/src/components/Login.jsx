import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import API from '../api/axios';

const Login = () => {
 
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email format')
      .required('Required'),
    password: Yup.string()
      .required('Required'),
  });

  // initialize Formik with initial values, validation and submit handler
  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,                         
    onSubmit: async (values, { setSubmitting }) => {

      try {
        // send POST request to login endpoint with form values
        const res = await API.post('/auth/login', values);

        // store JWT token in localStorage for authenticated requests
        localStorage.setItem('token', res.data.token);

        toast.success('Logged in successfully 🚀');
        navigate('/profile');

      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form className="auth-container" onSubmit={formik.handleSubmit}>
      <h2>Login</h2>

      <input
        name="email"
        type="email"
        placeholder="Email"
       
        className={formik.touched.email && formik.errors.email ? 'error-input' : ''}
        {...formik.getFieldProps('email')} // bind Formik handlers and values
      />
      {formik.touched.email && formik.errors.email ? (
        <div className="error-message">{formik.errors.email}</div>
      ) : null}

      <input
        name="password"
        type="password"
        placeholder="Password"
        className={formik.touched.password && formik.errors.password ? 'error-input' : ''}
        {...formik.getFieldProps('password')}
      />
      {formik.touched.password && formik.errors.password ? (
        <div className="error-message">{formik.errors.password}</div>
      ) : null}

      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default Login;
